const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Determine the data directory - check for multiple possible extraction folders
function findDataDirectory(specifiedDir) {
    // If a specific directory is provided, validate it
    if (specifiedDir) {
        if (fs.existsSync(specifiedDir) && fs.existsSync(path.join(specifiedDir, 'data.txt'))) {
            return specifiedDir;
        } else {
            throw new Error(`Directory '${specifiedDir}' not found or doesn't contain data.txt`);
        }
    }
    
    // Find all SM_backup_ directories with data.txt
    const allDirs = fs.readdirSync('.').filter(dir => {
        try {
            return fs.statSync(dir).isDirectory() && 
                   dir.startsWith('SM_backup_') && 
                   fs.existsSync(path.join(dir, 'data.txt'));
        } catch {
            return false;
        }
    });
    
    if (allDirs.length === 0) {
        // Fallback to current directory
        if (fs.existsSync('data.txt')) {
            return '.';
        }
        throw new Error('No backup data found. Please extract a backup first.');
    }
    
    // Sort by folder modification time (most recent first)
    allDirs.sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime - statA.mtime;
    });
    
    return allDirs[0]; // Return most recently modified
}

// Import the shot packing utilities from root directory
const utilsPath = 'utils_shotpack.js';
if (fs.existsSync(utilsPath)) {
    eval(fs.readFileSync(utilsPath, 'utf8'));
} else {
    console.error(`Error: utils_shotpack.js not found in root directory`);
    console.log(`Please make sure utils_shotpack.js exists in the project root`);
    process.exit(1);
}

// Add missing utility functions that were referenced in the code
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function min(a, b) {
    return Math.min(a, b);
}

function max(a, b) {
    return Math.max(a, b);
}

function abs(value) {
    return Math.abs(value);
}

function sign(value) {
    return Math.sign(value);
}

// Define constants that might be missing
const FPS = 1; // feet per second conversion factor
const DEG = Math.PI / 180; // degrees to radians

// Function to read and decompress zlib compressed string files
function storage_read_string(str_id, dataDir) {
    try {
        const filePath = path.join(dataDir, `string-${str_id}.z`);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return null;
        }
        
        const buf = fs.readFileSync(filePath);
        const text = zlib.inflateSync(buf).toString();
        console.log(`Reading string ${str_id}: ${buf.length} -> ${text.length} bytes`);
        return text;
    } catch (e) {
        console.log("Error reading string", str_id, e.message);
        return null;
    }
}

// Function to read the main data file
function read_main_data(dataDir) {
    try {
        const dataPath = path.join(dataDir, 'data.txt');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.log("Error reading main data file:", e.message);
        return null;
    }
}

// Function to read the archive file
function read_archive_data(dataDir) {
    try {
        const archivePath = path.join(dataDir, 'archive.txt');
        const data = fs.readFileSync(archivePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.log("Error reading archive file:", e.message);
        return null;
    }
}

// Function to get all available string IDs
function get_available_string_ids(dataDir) {
    const files = fs.readdirSync(dataDir);
    const stringFiles = files.filter(file => file.startsWith('string-') && file.endsWith('.z'));
    return stringFiles.map(file => file.replace('string-', '').replace('.z', ''));
}

// Function to decode shots from a frame
function decode_frame_shots(frame, dataDir) {
    if (frame.shots) {
        console.log(`\nDecoding ${frame.shots.length} shots for frame ${frame.id || 'unknown'}:`);
        frame.shots.forEach((shot, index) => {
            if (typeof shot === 'string') {
                try {
                    const decoded = decode_shot(shot);
                    console.log(`  Shot ${index + 1}:`, {
                        timestamp: new Date(decoded.ts),
                        x: decoded.x?.toFixed(2),
                        y: decoded.y?.toFixed(2),
                        velocity: decoded.v?.toFixed(1),
                        temp: decoded.temp,
                        error: decoded.error,
                        warning: decoded.warning,
                        multi_assign: decoded.multi_assign
                    });
                } catch (e) {
                    console.log(`  Shot ${index + 1}: Error decoding - ${e.message}`);
                }
            }
        });
    }
    
    if (frame.shots_invalid && frame.shots_invalid.length > 0) {
        console.log(`\nDecoding ${frame.shots_invalid.length} invalid shots:`);
        frame.shots_invalid.forEach((shot, index) => {
            if (typeof shot === 'string') {
                try {
                    const decoded = decode_shot(shot);
                    console.log(`  Invalid Shot ${index + 1}:`, {
                        timestamp: new Date(decoded.ts),
                        error: decoded.error,
                        warning: decoded.warning
                    });
                } catch (e) {
                    console.log(`  Invalid Shot ${index + 1}: Error decoding - ${e.message}`);
                }
            }
        });
    }
}

// Main function
function main() {
    const args = process.argv.slice(2);
    
    // Handle help request
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    // Parse command line arguments
    const specifiedDir = args[0];
    
    let dataDir;
    try {
        dataDir = findDataDirectory(specifiedDir);
        console.log(`Using data directory: ${path.resolve(dataDir)}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        
        // Show available directories
        const availableDirs = fs.readdirSync('.').filter(dir => {
            try {
                return fs.statSync(dir).isDirectory() && 
                       dir.startsWith('SM_backup_') && 
                       fs.existsSync(path.join(dir, 'data.txt'));
            } catch {
                return false;
            }
        });
        
        if (availableDirs.length > 0) {
            console.log(`\nAvailable backup directories:`);
            availableDirs.forEach(dir => console.log(`  • ${dir}`));
            console.log(`\nExample: node backup_reader.js ${availableDirs[0]}`);
        } else {
            console.log(`\nNo backup directories found. Extract a backup first:`);
            console.log(`  node extract_backup.js your_backup.tar`);
        }
        
        console.log(`\nUse --help for usage information`);
        process.exit(1);
    }
    
    console.log("=== Shot Marker Backup Reader ===\n");
    
    // Read main data
    console.log("Reading main data file...");
    const mainData = read_main_data(dataDir);
    if (mainData) {
        console.log(`Version: ${mainData.version}`);
        console.log(`Timestamp: ${new Date(mainData.ts)}`);
        console.log(`Number of frames: ${Object.keys(mainData.frames || {}).length}`);
        
        // Process frames with shot data
        const framesWithShots = Object.entries(mainData.frames || {}).filter(([id, frame]) => 
            (frame.shots && frame.shots.length > 0) || (frame.shots_invalid && frame.shots_invalid.length > 0)
        );
        
        console.log(`\nFrames with shot data: ${framesWithShots.length}`);
        
        framesWithShots.forEach(([id, frame]) => {
            console.log(`\n--- Frame ${id} (${frame.label || 'No label'}) ---`);
            decode_frame_shots(frame, dataDir);
        });
    }
    
    // Read archive data
    console.log("\n\nReading archive data file...");
    const archiveData = read_archive_data(dataDir);
    if (archiveData) {
        console.log("Archive data loaded successfully");
        // Process archive data if needed
    }
    
    // List available string files
    console.log("\n\nAvailable compressed string files:");
    const stringIds = get_available_string_ids(dataDir);
    console.log(`Found ${stringIds.length} string files`);
    
    // Read a few string files as examples
    console.log("\nReading sample string files:");
    stringIds.slice(0, 5).forEach(id => {
        const content = storage_read_string(id, dataDir);
        if (content) {
            console.log(`String ${id} (first 100 chars): ${content.substring(0, 100)}...`);
        }
    });
}

function showUsage() {
    console.log(`
🗂️  Shot Marker Backup Reader

Usage:
  node backup_reader.js [backup_directory]

Examples:
  node backup_reader.js                           # Use most recent backup folder
  node backup_reader.js SM_backup_Aug_13          # Read specific backup folder
  node backup_reader.js SM_backup_May_16_Vic_Final # Read May backup
  node backup_reader.js --help                    # Show this help

Arguments:
  backup_directory   Path to backup folder with data.txt (optional)

Notes:
  • If no directory specified, uses most recently extracted backup
  • Directory must contain data.txt file
  • Automatically processes shots, strings, and archive data
`);
}

// Run the main function
if (require.main === module) {
    main();
}

module.exports = {
    storage_read_string,
    read_main_data,
    read_archive_data,
    get_available_string_ids,
    decode_frame_shots,
    decode_shot,
    encode_shot
};
