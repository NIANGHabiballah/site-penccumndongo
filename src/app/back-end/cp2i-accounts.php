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
        error_log('PUT request error: ' . $e->getMessage());
        error_log('PUT request trace: ' . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
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
        
        // Récupérer tous les comptes avec plain_password et informations complètes
        $stmt = $db->prepare("SELECT id, email, nom, prenom, role, email_verified, created_at, plain_password, telephone, whatsapp, ville FROM cp2i_users ORDER BY role, created_at DESC");
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
    
    error_log('UPDATE REQUEST: ' . json_encode($input));
    
    $id = $input['id'] ?? null;
    $prenom = $input['prenom'] ?? '';
    $nom = $input['nom'] ?? '';
    $email = $input['email'] ?? '';
    $role = $input['role'] ?? 'participant';
    $telephone = $input['telephone'] ?? '';
    $whatsapp = $input['whatsapp'] ?? '';
    $ville = $input['ville'] ?? '';
    $password = $input['password'] ?? null;
    
    // Mise à jour avec tous les champs
    $stmt = $db->prepare("UPDATE cp2i_users SET prenom = ?, nom = ?, email = ?, role = ?, telephone = ?, whatsapp = ?, ville = ? WHERE id = ?");
    $stmt->execute([$prenom, $nom, $email, $role, $telephone, $whatsapp, $ville, $id]);
    
    // Mise à jour du mot de passe seulement si fourni
    if ($password && trim($password) !== '') {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE cp2i_users SET password = ?, plain_password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $password, $id]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Utilisateur modifié avec succès']);
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