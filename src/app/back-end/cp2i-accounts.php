<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    
    // Vérifier que l'utilisateur est admin
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    // Les mots de passe sont maintenant gérés de façon centralisée
    
    getAllAccountsWithPasswords();
} elseif ($method === 'PUT') {
    try {
        $user = verifyToken();
        
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
        
        updateUserAccount();
    } catch (Exception $e) {
        error_log('PUT request auth error: ' . $e->getMessage());
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide ou manquant']);
    }
} elseif ($method === 'DELETE') {
    $user = verifyToken();
    
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    deleteUserAccount();
}

function updateAdminPasswords() {
    // Cette fonction ne fait plus rien - les mots de passe sont gérés par les fonctions centralisées
    return;
}

function getAllAccountsWithPasswords() {
    try {
        $db = getDB();
        
        // Récupérer tous les comptes avec plain_password
        $stmt = $db->prepare("SELECT id, email, nom, prenom, telephone, role, email_verified, created_at, plain_password FROM cp2i_users ORDER BY role, created_at DESC");
        $stmt->execute();
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log('Accounts found: ' . count($accounts));
        
        // Utiliser plain_password pour les admins/correcteurs
        foreach ($accounts as &$account) {
            if ($account['role'] === 'participant') {
                $account['mot_de_passe_clair'] = null;
            } else {
                $account['mot_de_passe_clair'] = $account['plain_password'];
            }
            unset($account['plain_password']);
        }
        
        echo json_encode([
            'success' => true,
            'accounts' => $accounts,
            'total' => count($accounts)
        ]);
    } catch (Exception $e) {
        error_log('Error in getAllAccountsWithPasswords: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'accounts' => [],
            'total' => 0
        ]);
    }
}



function updateUserAccount() {
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log pour débogage
    error_log('UPDATE REQUEST: ' . json_encode($input));
    
    $id = $input['id'] ?? null;
    $prenom = $input['prenom'] ?? '';
    $nom = $input['nom'] ?? '';
    $email = $input['email'] ?? '';
    $telephone = $input['telephone'] ?? '';
    $role = $input['role'] ?? 'participant';
    $password = $input['password'] ?? null;
    
    if (!$id || !$prenom || !$nom || !$email || !$telephone) {
        http_response_code(400);
        echo json_encode(['error' => 'Tous les champs sont requis']);
        return;
    }
    
    // Vérifier si l'email existe déjà pour un autre utilisateur
    $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $id]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet email est déjà utilisé']);
        return;
    }
    
    try {
        // Mettre à jour les informations de base
        $stmt = $db->prepare("UPDATE cp2i_users SET prenom = ?, nom = ?, email = ?, telephone = ?, role = ? WHERE id = ?");
        $stmt->execute([$prenom, $nom, $email, $telephone, $role, $id]);
        
        // Mettre à jour le mot de passe si fourni
        if ($password) {
            setUserPassword($db, $id, $password, $role);
            error_log("Password updated with consistency for user ID: $id");
        }
        
        error_log('UPDATE SUCCESS for user ID: ' . $id);
        echo json_encode(['success' => true, 'message' => 'Utilisateur modifié avec succès']);
    } catch (Exception $e) {
        error_log('UPDATE ERROR: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la modification: ' . $e->getMessage()]);
    }
}

function deleteUserAccount() {
    $db = getDB();
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur requis']);
        return;
    }
    
    try {
        // Supprimer d'abord les textes associés
        $stmt = $db->prepare("DELETE FROM cp2i_textes WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Supprimer l'utilisateur
        $stmt = $db->prepare("DELETE FROM cp2i_users WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Utilisateur non trouvé']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
    }
}
?>