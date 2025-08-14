const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Import decode_shot function from utils_shotpack.js
const utilsPath = 'utils_shotpack.js';
if (fs.existsSync(utilsPath)) {
    eval(fs.readFileSync(utilsPath, 'utf8'));
} else {
    console.error(`Error: utils_shotpack.js not found in root directory`);
    process.exit(1);
}

// Constants (like in the CSV export code)
const FPS = 3.28084; // feet per second conversion factor
const DEG = 180 / Math.PI; // radians to degrees conversion

// Utility functions
function round(value, decimals = 0) {
    if (decimals === 0) return Math.round(value);
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Function to find data directory (similar to backup_reader.js)
function findDataDirectory(specifiedDir) {
    if (specifiedDir) {
        if (fs.existsSync(specifiedDir) && fs.existsSync(path.join(specifiedDir, 'data.txt'))) {
            return specifiedDir;
        } else {
            throw new Error(`Directory '${specifiedDir}' not found or doesn't contain data.txt`);
        }
    }
    
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
        throw new Error('No backup data found. Please extract a backup first.');
    }
    
    allDirs.sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime - statA.mtime;
    });
    
    return allDirs[0];
}

// Function to read and decompress string file
function readStringFile(dataDir, filename) {
    try {
        const filePath = path.join(dataDir, filename);
        const buf = fs.readFileSync(filePath);
        const text = zlib.inflateSync(buf).toString();
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error reading ${filename}:`, e.message);
        return null;
    }
}

// Function to get all string files
function getStringFiles(dataDir) {
    return fs.readdirSync(dataDir)
        .filter(file => file.startsWith('string-') && file.endsWith('.z'))
        .sort();
}

// Function to calculate shot string for a match
function calculateShotString(shots) {
    const scoreShots = shots.filter(shot => !shot.sighter);
    return scoreShots.map(shot => {
        if (shot.score === 'V') return 'V';
        if (typeof shot.score === 'number') return shot.score.toString();
        if (typeof shot.score === 'string') return shot.score;
        return '0'; // fallback for undefined scores
    }).join(',');
}

// Function to calculate total score
function calculateTotal(shots) {
    const scoreShots = shots.filter(shot => !shot.sighter);
    let total = 0;
    let vCount = 0;
    
    scoreShots.forEach(shot => {
        if (shot.score === 'V') {
            total += 5; // V is worth 5 points
            vCount++;
        } else {
            total += parseInt(shot.score) || 0;
        }
    });
    
    return `${total}-${vCount}`;
}

// Function to generate shot tags (like the CSV export)
function generateShotTags(shot) {
    const tags = [];
    if (shot.fake) tags.push("inserted");
    else if (shot.score_override) tags.push("modified");
    if (shot.off) tags.push("off");
    if (shot.hide) tags.push("hidden");
    if (shot.sighter) tags.push("sighter");
    if (shot.simulated) tags.push("simulated");
    if (shot.warning) tags.push("warning-" + shot.warning);
    if (!shot.fake && shot.v_count != 4) tags.push("incomplete");
    return tags.join("/");
}

// Function to determine shooter name
function getShooterName(matchData) {
    // Try to extract from various fields
    if (matchData.name && matchData.name !== 'A') {
        return matchData.name;
    }
    
    // Look for shooter info in notes or other fields
    if (matchData.notes && matchData.notes.trim()) {
        return matchData.notes.trim();
    }
    
    // Default fallback
    return "Unknown Shooter";
}

// Function to read archive data
function readArchiveData(dataDir) {
    try {
        const archivePath = path.join(dataDir, 'archive.txt');
        const data = fs.readFileSync(archivePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Error reading archive.txt:`, e.message);
        return {};
    }
}

// Function to extract match data from a string file using archive metadata
function extractMatchData(dataDir, filename, archiveData) {
    const data = readStringFile(dataDir, filename);
    if (!data || !data.shots || data.shots.length === 0) {
        return null;
    }
    
    // Extract timestamp from filename (string-1715436178223.z -> 1715436178223)
    const timestamp = filename.replace('string-', '').replace('.z', '');
    const archiveEntry = archiveData[timestamp];
    
    if (!archiveEntry) {
        console.log(`No archive entry found for ${timestamp}`);
        return null;
    }
    
    // Filter by target_name - only include certain targets (like the CSV export does)
    if (archiveEntry.target_name !== "9" && archiveEntry.target_name !== "11" && 
        !archiveEntry.target_name.startsWith("M") && !archiveEntry.target_name.startsWith("T")) {
        return null; // Skip non-match targets
    }
    
    // Process shots - handle encoded vs direct format
    let processedShots = [...data.shots];
    
    if (data.encoded && data.score_string) {
        // Decode shots and add display_text and score from score_string
        const scoreInfo = data.score_string.split(",");
        
        for (let j = 0; j < processedShots.length; j++) {
            if (typeof processedShots[j] === 'string') {
                // This is an encoded shot, decode it
                try {
                    processedShots[j] = decode_shot(processedShots[j]);
                } catch (e) {
                    console.log('Error decoding shot:', e.message);
                    continue;
                }
            }
            
            // Add score information from score_string
            if (scoreInfo[j]) {
                const shotScoreInfo = scoreInfo[j].split(":");
                processedShots[j].display_text = shotScoreInfo[0];
                processedShots[j].score = shotScoreInfo[1];
            }
        }
    }
    
    // Separate sighters and scoring shots
    const scoringShots = processedShots.filter(shot => !shot.sighter);
    
    if (scoringShots.length === 0) {
        return null; // No scoring shots, just sighters
    }
    
    const shotString = calculateShotString(processedShots);
    const total = calculateTotal(processedShots);
    
    // Use archive data for proper match info
    const shooterName = archiveEntry.name && archiveEntry.name !== 'A' ? archiveEntry.name : "Unknown Shooter";
    const matchName = archiveEntry.target_name || `Match ${data.id}`;
    
    return {
        match: matchName,
        shots: shotString,
        total: total,
        user: shooterName,
        timestamp: new Date(archiveEntry.ts),
        distance: archiveEntry.distance,
        target_face: archiveEntry.face_id,
        group_text: archiveEntry.group,
        shot_data: processedShots.map(shot => {
            // Apply calibration and conversions like CSV export
            const temp = shot.temp;
            const x = shot.x + (data.cal_x || 0); // Apply calibration offset
            const y = shot.y + (data.cal_y || 0); // Apply calibration offset  
            const v = shot.v * FPS; // Convert to fps
            const yaw = shot.theta * DEG; // Convert to degrees
            const pitch = shot.phi * DEG; // Convert to degrees
            
            return {
                x: round(x),
                y: round(y), 
                score: shot.score,
                sighter: shot.sighter === true,
                // display_text: shot.display_text,
                // timestamp: new Date(shot.ts),
                velocity: round(v),
                // temperature: round(temp, 1),
                // yaw: round(yaw, 1),
                // pitch: round(pitch, 1),
                target_face: archiveEntry.face_id,
                tags: generateShotTags(shot),
                quality: shot.v_count == 4 ? round(shot.err_v, 1) : null
            };
        })
    };
}

// Main extraction function
function extractAllMatches(dataDir, outputFile) {
    console.log(`Extracting match data from: ${path.resolve(dataDir)}`);
    
    // Read archive data first
    const archiveData = readArchiveData(dataDir);
    const archiveKeys = Object.keys(archiveData);
    console.log(`Found ${archiveKeys.length} archive entries`);
    
    const stringFiles = getStringFiles(dataDir);
    console.log(`Found ${stringFiles.length} string files`);
    
    const matches = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    // Process archive entries in reverse order (like CSV export)
    for (let i = archiveKeys.length - 1; i >= 0; i--) {
        const timestamp = archiveKeys[i];
        const filename = `string-${timestamp}.z`;
        
        try {
            // Check if string file exists
            if (!stringFiles.includes(filename)) {
                skippedCount++;
                continue;
            }
            
            const matchData = extractMatchData(dataDir, filename, archiveData);
            if (matchData) {
                matches.push(matchData);
                processedCount++;
            } else {
                skippedCount++;
            }
        } catch (error) {
            console.log(`Error processing ${filename}: ${error.message}`);
            skippedCount++;
        }
    }
    
    console.log(`Processed ${processedCount} matches, skipped ${skippedCount} entries`);
    
    // Sort matches by timestamp (chronological order)
    matches.sort((a, b) => a.timestamp - b.timestamp);
    
    // Write to JSON file
    const jsonOutput = JSON.stringify(matches, null, 2);
    fs.writeFileSync(outputFile, jsonOutput);
    
    console.log(`✅ Extracted ${matches.length} matches to ${outputFile}`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    matches.slice(0, 10).forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.match} - ${match.total} (${match.shots.split(',').length} shots) - ${match.user} [${match.group_text}]`);
    });
    
    if (matches.length > 10) {
        console.log(`  ... and ${matches.length - 10} more matches`);
    }
    
    return matches;
}

// Show usage information
function showUsage() {
    console.log(`
🎯 Shot Marker JSON Extractor

Usage:
  node extract_json.js [backup_directory] [output_file]

Examples:
  node extract_json.js                                    # Use most recent backup, output to matches.json
  node extract_json.js SM_backup_May_16_Vic_Final        # Extract from specific backup
  node extract_json.js SM_backup_Aug_13 my_matches.json  # Custom output file
  node extract_json.js --help                            # Show this help

Arguments:
  backup_directory   Path to backup folder with data.txt (optional)
  output_file        JSON output filename (optional, defaults to matches.json)

Output Format:
  [
    {
      "match": "Match Name",
      "shots": "V,5,4,5,4,5,4,5",
      "total": "50-5",
      "user": "Shooter Name",
      "shot_data": [
        {
          "x": 12.3,
          "y": -45.6,
          "score": "V",
          "sighter": false,
          "target_face": "IF300m"
        }
      ]
    }
  ]

Notes:
  • Only extracts matches with scoring shots (excludes sighter-only sessions)
  • Shots string includes only scoring shots (not sighters)
  • Total format: "points-V_count" (e.g., "48-3" = 48 points with 3 V's)
  • X,Y coordinates are in target units relative to center
`);
}

// Main function
function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    const specifiedDir = args[0];
    const outputFile = args[1] || 'matches.json';
    
    try {
        const dataDir = findDataDirectory(specifiedDir);
        extractAllMatches(dataDir, outputFile);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        
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
        }
        
        console.log(`\nUse --help for usage information`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    extractAllMatches,
    extractMatchData,
    findDataDirectory
};
