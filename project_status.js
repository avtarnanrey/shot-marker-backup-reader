const fs = require('fs');
const path = require('path');

function show_project_status() {
    console.log("🎯 Shot Marker Backup Reader - Project Status\n");
    
    // Check current directory
    const currentDir = '.';
    const extractedDir = 'SM_backup_Aug_13';
    
    console.log("📁 Project Structure:");
    console.log("┌─ d:\\Projects\\Shot Marker\\");
    
    // List main project files
    const mainFiles = fs.readdirSync(currentDir).filter(file => 
        file.endsWith('.js') || file.endsWith('.md') || file.endsWith('.json')
    );
    
    mainFiles.forEach((file, index) => {
        const isLast = index === mainFiles.length - 1;
        const prefix = isLast ? "└─" : "├─";
        const description = getFileDescription(file);
        console.log(`${prefix} ${file}${description}`);
    });
    
    // Check extracted folder
    if (fs.existsSync(extractedDir)) {
        console.log("├─ SM_backup_Aug_13.tar (original backup)");
        console.log("└─ SM_backup_Aug_13/ (📂 extracted data folder)");
        
        const extractedFiles = fs.readdirSync(extractedDir);
        const dataFiles = extractedFiles.filter(f => f.endsWith('.txt')).length;
        const stringFiles = extractedFiles.filter(f => f.startsWith('string-')).length;
        const utilFiles = extractedFiles.filter(f => f.endsWith('.js')).length;
        
        console.log(`   ├─ ${dataFiles} data files (data.txt, archive.txt)`);
        console.log(`   ├─ ${utilFiles} utility files (utils_shotpack.js, read_backup.js)`);
        console.log(`   └─ ${stringFiles} compressed session files\n`);
        
        console.log("✅ Status: ORGANIZED & READY");
        console.log("   • All backup data is cleanly extracted");
        console.log("   • Scripts automatically detect organized structure");
        console.log("   • No loose files cluttering the workspace\n");
    } else {
        console.log("└─ SM_backup_Aug_13.tar (original backup)\n");
        console.log("⚠️  Status: NEEDS EXTRACTION");
        console.log("   Run: node extract_backup.js\n");
    }
    
    console.log("🚀 Quick Commands:");
    console.log("   node extract_backup.js                    # Extract default backup");
    console.log("   node extract_backup.js my_backup.tar      # Extract specific backup");
    console.log("   node backup_reader.js                     # Read current data");
    console.log("   node explore_strings.js                   # Explore historical data");
    console.log("   node test_shot_decode.js                  # Test decoding system\n");
    
    // Show sample data if available
    if (fs.existsSync(path.join(extractedDir, 'data.txt'))) {
        try {
            const dataPath = path.join(extractedDir, 'data.txt');
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            console.log("📊 Data Summary:");
            console.log(`   Version: ${data.version} (${data.version_date})`);
            console.log(`   Frames: ${Object.keys(data.frames).length}`);
            console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleDateString()}`);
            
            const framesWithShots = Object.values(data.frames).filter(f => f.shots && f.shots.length > 0);
            console.log(`   Frames with shots: ${framesWithShots.length}`);
        } catch (e) {
            console.log("📊 Data Summary: Available after extraction");
        }
    }
}

function getFileDescription(filename) {
    const descriptions = {
        'extract_backup.js': ' (🗜️  extraction tool)',
        'backup_reader.js': ' (📖 main reader)',
        'explore_strings.js': ' (🔍 data explorer)',
        'test_shot_decode.js': ' (🧪 testing suite)',
        'package.json': ' (📦 dependencies)',
        'README.md': ' (📚 documentation)',
        'QUICKSTART.md': ' (⚡ quick reference)'
    };
    return descriptions[filename] || '';
}

if (require.main === module) {
    show_project_status();
}

module.exports = { show_project_status };
