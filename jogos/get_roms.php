<?php
header('Content-Type: application/json');

$dir = __DIR__ . '/assets/romario/';

// Verifica se o diretório existe
if (is_dir($dir)) {
    // Escaneia a pasta
    $files = scandir($dir);
    
    // Filtra para pegar apenas arquivos .sfc e ignorar 'romario.sfc'
    $roms = array_values(array_filter($files, function($file) use ($dir) {
        $filePath = $dir . $file;
        return is_file($filePath) 
            && pathinfo($file, PATHINFO_EXTENSION) === 'sfc' 
            && $file !== 'romario.sfc';
    }));

    echo json_encode($roms);
} else {
    // Retorna array vazio se não houver diretório
    echo json_encode([]);
}
