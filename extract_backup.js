const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractBackup(tarFilePath, customExtractDir) {
    // Parse command line arguments or use defaults
    const tarFile = tarFilePath || 'SM_backup_Aug_13.tar';
    const baseName = path.basename(tarFile, path.extname(tarFile));
    const extractDir = customExtractDir || baseName;
    
    // Check if tar file exists
    if (!fs.existsSync(tarFile)) {
        console.error(`Error: ${tarFile} not found in current directory`);
        process.exit(1);
    }
    
    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
        console.log(`Creating directory: ${extractDir}`);
        fs.mkdirSync(extractDir, { recursive: true });
    } else {
        console.log(`Directory ${extractDir} already exists`);
    }
    
    try {
        console.log(`Extracting ${tarFile} to ${extractDir}/...`);
        
        // Extract tar file to the directory
        execSync(`tar -xf "${tarFile}" -C "${extractDir}"`, { stdio: 'inherit' });
        
        console.log(`\n✅ Extraction complete!`);
        console.log(`\nContents extracted to: ${path.resolve(extractDir)}`);
        
        // List the contents
        const contents = fs.readdirSync(extractDir);
        console.log(`\nExtracted files (${contents.length}):`);
        contents.slice(0, 10).forEach(file => {
            const stats = fs.statSync(path.join(extractDir, file));
            const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : ' (directory)';
            console.log(`  ${file}${size}`);
        });
        
        if (contents.length > 10) {
            console.log(`  ... and ${contents.length - 10} more files`);
        }
        
        console.log(`\n📂 To use the scripts with extracted data:`);
        console.log(`   node backup_reader.js`);
        console.log(`   node explore_strings.js`);
        console.log(`\n💡 Pro tip: Scripts automatically detect the extracted folder!`);
        
    } catch (error) {
        console.error(`Error extracting tar file: ${error.message}`);
        process.exit(1);
    }
}

function showUsage() {
    console.log(`
🗜️  Shot Marker Backup Extractor

Usage:
  node extract_backup.js [tar_file] [extract_directory]

Examples:
  node extract_backup.js                                    # Use default: SM_backup_Aug_13.tar
  node extract_backup.js SM_backup_May_16_Vic_Final.tar     # Extract specific backup
  node extract_backup.js my_backup.tar custom_folder        # Custom output folder
  node extract_backup.js --help                             # Show this help

Arguments:
  tar_file          Path to the .tar backup file (optional)
  extract_directory Custom extraction directory (optional, defaults to tar filename)

Notes:
  • If no arguments provided, looks for 'SM_backup_Aug_13.tar'
  • Extraction directory defaults to tar filename without extension
  • Scripts automatically detect extracted folders
`);
}

function main() {
    const args = process.argv.slice(2);
    
    // Handle help request first
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    // Parse arguments
    const tarFile = args[0];
    const extractDir = args[1];
    
    // Validate tar file exists if specified
    if (tarFile && !fs.existsSync(tarFile)) {
        console.error(`❌ Error: File '${tarFile}' not found`);
        console.log(`\nAvailable .tar files in current directory:`);
        const tarFiles = fs.readdirSync('.').filter(f => f.endsWith('.tar'));
        if (tarFiles.length > 0) {
            tarFiles.forEach(f => console.log(`  • ${f}`));
        } else {
            console.log(`  (no .tar files found)`);
        }
        console.log(`\nUse --help for usage information`);
        process.exit(1);
    }
    
    // Check for default file if no arguments
    if (!tarFile && !fs.existsSync('SM_backup_Aug_13.tar')) {
        console.error(`❌ Error: Default file 'SM_backup_Aug_13.tar' not found`);
        console.log(`\nPlease specify a tar file:`);
        const tarFiles = fs.readdirSync('.').filter(f => f.endsWith('.tar'));
        if (tarFiles.length > 0) {
            console.log(`Available files:`);
            tarFiles.forEach(f => console.log(`  node extract_backup.js ${f}`));
        } else {
            console.log(`No .tar files found in current directory`);
        }
        process.exit(1);
    }
    
    extractBackup(tarFile, extractDir);
}

if (require.main === module) {
    main();
}

module.exports = { extractBackup };
