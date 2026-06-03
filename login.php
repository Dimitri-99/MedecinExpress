<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestion du protocole OPTIONS (CORS) envoyé par les smartphones
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db_name = "medecinexpress_db";
$username = "root";
$password = "";

try {
    // 1. Initialisation de la connexion PDO ($conn)
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("set names utf8mb4");
} catch(PDOException $exception) {
    echo json_encode(["status" => "error", "message" => "Connexion à la base échouée : " . $exception->getMessage()]);
    exit();
}

// 2. Récupération et décodage des données JSON reçues ($data)
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    // Nettoyage de l'email
    $email = htmlspecialchars(strip_tags($data->email));

    try {
        // 3. Requête SQL complète pour récupérer l'utilisateur et ses données de profil
        $query = "SELECT id, nom, prenom, email, groupe_sanguin, dossier_medical, password FROM users WHERE email = :email LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 4. Vérification du mot de passe avec le hash de la BDD
            if (password_verify($data->password, $row['password'])) {
                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "message" => "Connexion réussie !",
                    "user" => [
                        "id" => $row['id'],
                        "nom" => $row['nom'],
                        "prenom" => $row['prenom'],
                        "email" => $row['email'],
                        "groupe_sanguin" => $row['groupe_sanguin'],
                        "dossier_medical" => $row['dossier_medical']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Mot de passe incorrect."]);
            }
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Aucun compte trouvé avec cet email."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erreur SQL : " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Données incomplètes. Email et mot de passe requis."]);
}
?>