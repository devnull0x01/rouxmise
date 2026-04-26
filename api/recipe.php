<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db     = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    switch ($method) {

        case 'GET':
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or missing id']);
                exit;
            }
            $stmt = $db->prepare('
                SELECT id, name, category, servings, ingredients, instructions, notes, created_at, updated_at
                FROM recipes
                WHERE id = :id
            ');
            $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
            $result = $stmt->execute();
            $row    = $result->fetchArray(SQLITE3_ASSOC);

            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Recipe not found']);
                exit;
            }
            echo json_encode(['success' => true, 'data' => $row]);
            break;

        case 'POST':
            $body = json_decode(file_get_contents('php://input'), true);
            if (!isset($body['name']) || trim($body['name']) === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Recipe name is required']);
                exit;
            }
            $stmt = $db->prepare('
                INSERT INTO recipes (name, category, servings, ingredients, instructions, notes)
                VALUES (:name, :category, :servings, :ingredients, :instructions, :notes)
            ');
            $stmt->bindValue(':name',         trim($body['name']),                        SQLITE3_TEXT);
            $stmt->bindValue(':category',     trim($body['category']     ?? 'Other'),     SQLITE3_TEXT);
            $stmt->bindValue(':servings',     trim($body['servings']     ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':ingredients',  trim($body['ingredients']  ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':instructions', trim($body['instructions'] ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':notes',        trim($body['notes']        ?? ''),          SQLITE3_TEXT);
            $stmt->execute();
            $newId = $db->lastInsertRowID();
            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $newId]);
            break;

        case 'PUT':
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or missing id']);
                exit;
            }
            $body = json_decode(file_get_contents('php://input'), true);
            if (!isset($body['name']) || trim($body['name']) === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Recipe name is required']);
                exit;
            }
            $stmt = $db->prepare('
                UPDATE recipes
                SET name         = :name,
                    category     = :category,
                    servings     = :servings,
                    ingredients  = :ingredients,
                    instructions = :instructions,
                    notes        = :notes,
                    updated_at   = CURRENT_TIMESTAMP
                WHERE id = :id
            ');
            $stmt->bindValue(':name',         trim($body['name']),                        SQLITE3_TEXT);
            $stmt->bindValue(':category',     trim($body['category']     ?? 'Other'),     SQLITE3_TEXT);
            $stmt->bindValue(':servings',     trim($body['servings']     ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':ingredients',  trim($body['ingredients']  ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':instructions', trim($body['instructions'] ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':notes',        trim($body['notes']        ?? ''),          SQLITE3_TEXT);
            $stmt->bindValue(':id',           $id,                                        SQLITE3_INTEGER);
            $stmt->execute();
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or missing id']);
                exit;
            }
            $stmt = $db->prepare('DELETE FROM recipes WHERE id = :id');
            $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
            $stmt->execute();
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
