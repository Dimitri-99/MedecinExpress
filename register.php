<?php
// ==========================================
// MédecinExpress - API Register
// ==========================================

// En-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Traiter les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration de la base de données
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'medecinexpress_db';

// Connexion MySQL
$conn = new mysqli($host, $user, $password, $database);

// Vérifier la connexion
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données'
    ]);
    exit();
}

// Définir le charset UTF-8
$conn->set_charset('utf8mb4');

// Récupérer les données JSON
$data = json_decode(file_get_contents('php://input'), true);

// Vérifier que la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Méthode non autorisée'
    ]);
    exit();
}

// Vérifier les champs obligatoires
$required_fields = ['email', 'password', 'nom', 'prenom', 'date_naissance', 'groupe_sanguin'];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Champ obligatoire manquant: ' . $field
        ]);
        exit();
    }
}

// Valider l'email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Email invalide'
    ]);
    exit();
}

// Valider le groupe sanguin
$valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
if (!in_array($data['groupe_sanguin'], $valid_blood_groups)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Groupe sanguin invalide'
    ]);
    exit();
}

// Valider la date
$date = DateTime::createFromFormat('Y-m-d', $data['date_naissance']);
if (!$date || $date->format('Y-m-d') !== $data['date_naissance']) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Format de date invalide (YYYY-MM-DD)'
    ]);
    exit();
}

// Vérifier si l'email existe déjà
$email = $conn->real_escape_string($data['email']);
$check_email = $conn->query("SELECT id FROM users WHERE email = '$email'");

if ($check_email && $check_email->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        'status' => 'error',
        'message' => 'Cet email est déjà utilisé'
    ]);
    $conn->close();
    exit();
}

// Hacher le mot de passe avec BCRYPT
$hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);

// Préparer les données pour l'insertion
$nom = $conn->real_escape_string($data['nom']);
$prenom = $conn->real_escape_string($data['prenom']);
$date_naissance = $conn->real_escape_string($data['date_naissance']);
$groupe_sanguin = $conn->real_escape_string($data['groupe_sanguin']);
$dossier_medical = isset($data['dossier_medical']) ? $conn->real_escape_string($data['dossier_medical']) : '';
$telephone = isset($data['telephone']) ? $conn->real_escape_string($data['telephone']) : '';
$contact_urgence = isset($data['contact_urgence']) ? $conn->real_escape_string($data['contact_urgence']) : '';

// Insérer l'utilisateur en base de données
$sql = "INSERT INTO users (
email,
password,
nom,
prenom,
date_naissance,
telephone,
contact_urgence,
groupe_sanguin,
dossier_medical
)
VALUES (
'$email',
'$hashed_password',
'$nom',
'$prenom',
'$date_naissance',
'$telephone',
'$contact_urgence',
'$groupe_sanguin',
'$dossier_medical'
)";
if ($conn->query($sql)) {
    $user_id = $conn->insert_id;
    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Inscription réussie',
        'user_id' => $user_id,
        'email' => $data['email']
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de l\'inscription: ' . $conn->error
    ]);
}

$conn->close();
?>