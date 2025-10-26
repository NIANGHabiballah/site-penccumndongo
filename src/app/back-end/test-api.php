<?php
// Test de l'API CP2i
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test API CP2i</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        .info { background: #d1ecf1; border-color: #bee5eb; }
        button { padding: 10px 15px; margin: 5px; cursor: pointer; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🧪 Test API CP2i</h1>
    
    <div class="test info">
        <h3>Configuration</h3>
        <p><strong>Base URL:</strong> <?php echo $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']); ?></p>
        <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
    </div>

    <div class="test">
        <h3>1. Test de connexion à la base de données</h3>
        <?php
        try {
            require_once 'config.php';
            $db = getDB();
            echo '<div class="success">✅ Connexion à la base de données réussie</div>';
        } catch (Exception $e) {
            echo '<div class="error">❌ Erreur de connexion: ' . $e->getMessage() . '</div>';
        }
        ?>
    </div>

    <div class="test">
        <h3>2. Test des tables</h3>
        <?php
        try {
            $tables = ['cp2i_users', 'cp2i_textes', 'cp2i_corrections'];
            foreach ($tables as $table) {
                $stmt = $db->prepare("SHOW TABLES LIKE ?");
                $stmt->execute([$table]);
                if ($stmt->fetch()) {
                    echo "<div class=\"success\">✅ Table $table existe</div>";
                } else {
                    echo "<div class=\"error\">❌ Table $table manquante</div>";
                }
            }
        } catch (Exception $e) {
            echo '<div class="error">❌ Erreur: ' . $e->getMessage() . '</div>';
        }
        ?>
    </div>

    <div class="test">
        <h3>3. Test d'inscription</h3>
        <button onclick="testRegister()">Tester l'inscription</button>
        <div id="register-result"></div>
    </div>

    <div class="test">
        <h3>4. Test de connexion</h3>
        <button onclick="testLogin()">Tester la connexion</button>
        <div id="login-result"></div>
    </div>

    <div class="test">
        <h3>5. Test de soumission de texte</h3>
        <button onclick="testSubmitText()">Tester la soumission</button>
        <div id="submit-result"></div>
    </div>

    <script>
        const baseUrl = window.location.href.replace('test-api.php', '');
        let authToken = '';

        async function testRegister() {
            const data = {
                email: 'test@cp2i.com',
                password: 'test123',
                nom: 'Test',
                prenom: 'User',
                telephone: '123456789',
                role: 'participant'
            };

            try {
                const response = await fetch(baseUrl + 'cp2i-auth.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                document.getElementById('register-result').innerHTML = 
                    `<pre>${JSON.stringify(result, null, 2)}</pre>`;
                
                if (result.token) {
                    authToken = result.token;
                }
            } catch (error) {
                document.getElementById('register-result').innerHTML = 
                    `<div class="error">Erreur: ${error.message}</div>`;
            }
        }

        async function testLogin() {
            const data = {
                email: 'test@cp2i.com',
                password: 'test123'
            };

            try {
                const response = await fetch(baseUrl + 'cp2i-auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                document.getElementById('login-result').innerHTML = 
                    `<pre>${JSON.stringify(result, null, 2)}</pre>`;
                
                if (result.token) {
                    authToken = result.token;
                }
            } catch (error) {
                document.getElementById('login-result').innerHTML = 
                    `<div class="error">Erreur: ${error.message}</div>`;
            }
        }

        async function testSubmitText() {
            if (!authToken) {
                document.getElementById('submit-result').innerHTML = 
                    `<div class="error">Veuillez d'abord vous connecter</div>`;
                return;
            }

            const data = {
                titre: 'Poème de test',
                contenu: 'Vers 1\nVers 2\nVers 3\nVers 4',
                langue: 'francais'
            };

            try {
                const response = await fetch(baseUrl + 'cp2i-textes.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                document.getElementById('submit-result').innerHTML = 
                    `<pre>${JSON.stringify(result, null, 2)}</pre>`;
            } catch (error) {
                document.getElementById('submit-result').innerHTML = 
                    `<div class="error">Erreur: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>