const path = require('path');
const fs = require('fs');

const FILE_DIRECTORIES = {
    default: '../public/uploads',
    submission: '../public/uploads/submissions'
};

const viewFile = (req, res) => {
    try {
        const fileName = req.params.fileName;
        const fileType = req.query.type || 'default';

        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            console.error(`[File] Percobaan akses path tidak valid: ${fileName}`);
            return res.status(403).send('Akses ditolak: Nama file tidak valid');
        }

        if (!FILE_DIRECTORIES[fileType]) {
            console.error(`[File] Jenis file tidak dikenal: ${fileType}`);
            return res.status(400).send('Jenis file tidak valid');
        }
        
        const targetDir = path.resolve(__dirname, FILE_DIRECTORIES[fileType]);
        const filePath = path.join(targetDir, fileName);

        if (!filePath.startsWith(targetDir)) {
            console.error(`[File] Percobaan akses di luar direktori: ${filePath}`);
            return res.status(403).send('Akses ditolak: Path tidak valid');
        }
        
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).send(`File tidak ditemukan`);
        }
    } catch (error) {
        console.error(`[File] Error: ${error.message}`);
        return res.status(500).send(`Terjadi kesalahan`);
    }
};

module.exports = {
    viewFile
};