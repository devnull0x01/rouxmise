<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = get_db();

$search   = isset($_GET['search'])   ? trim($_GET['search'])   : '';
$category = isset($_GET['category']) ? trim($_GET['category']) : '';

try {
    if ($search !== '') {
        $term = '%' . $search . '%';
        $stmt = $db->prepare('
            SELECT id, name, category, servings, ingredients, instructions, notes, created_at, updated_at
            FROM recipes
            WHERE name         LIKE :term
               OR category     LIKE :term
               OR ingredients  LIKE :term
               OR instructions LIKE :term
               OR notes        LIKE :term
            ORDER BY name ASC
        ');
        $stmt->bindValue(':term', $term, SQLITE3_TEXT);
    } elseif ($category !== '') {
        $stmt = $db->prepare('
            SELECT id, name, category, servings, ingredients, instructions, notes, created_at, updated_at
            FROM recipes
            WHERE category = :category
            ORDER BY name ASC
        ');
        $stmt->bindValue(':category', $category, SQLITE3_TEXT);
    } else {
        $stmt = $db->prepare('
            SELECT id, name, category, servings, ingredients, instructions, notes, created_at, updated_at
            FROM recipes
            ORDER BY name ASC
        ');
    }

    $result  = $stmt->execute();
    $recipes = [];

    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $recipes[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $recipes]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
