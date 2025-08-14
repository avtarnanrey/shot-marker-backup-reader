const { storage_read_string, get_available_string_ids } = require('./backup_reader.js');

// Function to analyze string file contents
function analyze_string_file(stringId) {
    const content = storage_read_string(stringId);
    if (!content) return null;
    
    try {
        const data = JSON.parse(content);
        return {
            id: stringId,
            timestamp: new Date(parseInt(stringId)),
            type: data.id ? 'frame_data' : 'unknown',
            frameId: data.id,
            label: data.label,
            hasShots: (data.shots && data.shots.length > 0),
            shotCount: data.shots ? data.shots.length : 0,
            invalidShotCount: data.shots_invalid ? data.shots_invalid.length : 0,
            distance: data.dist,
            distanceUnit: data.dist_unit,
            targetSize: `${data.width}x${data.height}`,
            active: data.active,
            dataSize: content.length
        };
    } catch (e) {
        return {
            id: stringId,
            timestamp: new Date(parseInt(stringId)),
            type: 'parse_error',
            error: e.message,
            dataSize: content.length,
            preview: content.substring(0, 100)
        };
    }
}

// Function to explore all string files
function explore_string_files() {
    console.log("=== Exploring Compressed String Files ===\n");
    
    const stringIds = get_available_string_ids();
    console.log(`Total string files: ${stringIds.length}\n`);
    
    // Sort by timestamp (which is the string ID)
    stringIds.sort((a, b) => parseInt(a) - parseInt(b));
    
    const analysis = stringIds.map(analyze_string_file).filter(Boolean);
    
    // Group by type
    const byType = analysis.reduce((acc, item) => {
        acc[item.type] = acc[item.type] || [];
        acc[item.type].push(item);
        return acc;
    }, {});
    
    console.log("File types found:");
    Object.entries(byType).forEach(([type, items]) => {
        console.log(`  ${type}: ${items.length} files`);
    });
    
    // Show files with shot data
    const filesWithShots = analysis.filter(item => item.hasShots);
    console.log(`\nFiles with shot data: ${filesWithShots.length}`);
    
    filesWithShots.forEach(item => {
        console.log(`  ${item.id} (${item.timestamp.toLocaleDateString()}): Frame ${item.frameId} "${item.label}" - ${item.shotCount} shots`);
    });
    
    // Show recent files (last 10)
    console.log(`\nMost recent files (last 10):`);
    analysis.slice(-10).forEach(item => {
        if (item.type === 'frame_data') {
            console.log(`  ${item.id}: Frame ${item.frameId} "${item.label}" - ${item.shotCount} shots, ${item.invalidShotCount} invalid`);
        } else {
            console.log(`  ${item.id}: ${item.type} - ${item.dataSize} bytes`);
        }
    });
    
    // Show parse errors if any
    const parseErrors = analysis.filter(item => item.type === 'parse_error');
    if (parseErrors.length > 0) {
        console.log(`\nParse errors (${parseErrors.length}):`);
        parseErrors.slice(0, 5).forEach(item => {
            console.log(`  ${item.id}: ${item.error}`);
            console.log(`    Preview: ${item.preview}...`);
        });
    }
    
    return analysis;
}

// Function to examine specific string files in detail
function examine_string_file(stringId) {
    console.log(`\n=== Examining String File ${stringId} ===`);
    
    const content = storage_read_string(stringId);
    if (!content) {
        console.log("File not found or could not be read");
        return;
    }
    
    try {
        const data = JSON.parse(content);
        console.log(`Timestamp: ${new Date(parseInt(stringId))}`);
        console.log(`Frame ID: ${data.id}`);
        console.log(`Label: ${data.label || 'No label'}`);
        console.log(`Active: ${data.active}`);
        console.log(`Target: ${data.width}x${data.height} at ${data.dist} ${data.dist_unit}`);
        console.log(`Face ID: ${data.face_id}`);
        
        if (data.shots && data.shots.length > 0) {
            console.log(`\nShots (${data.shots.length}):`);
            // Import decode function from backup_reader
            const { decode_shot } = require('./backup_reader.js');
            
            data.shots.forEach((shot, index) => {
                try {
                    // Check if shot is already an object or needs decoding
                    if (typeof shot === 'object' && shot.x !== undefined) {
                        // Shot is already decoded object
                        console.log(`  Shot ${index + 1}: (${shot.x?.toFixed(2)}, ${shot.y?.toFixed(2)}) at ${shot.v?.toFixed(1)} fps, temp: ${shot.temp?.toFixed(1)}°C`);
                    } else if (typeof shot === 'string') {
                        // Shot needs decoding
                        const decoded = decode_shot(shot);
                        console.log(`  Shot ${index + 1}: (${decoded.x?.toFixed(2)}, ${decoded.y?.toFixed(2)}) at ${decoded.v?.toFixed(1)} fps`);
                    } else {
                        // Unknown format, show raw data
                        console.log(`  Shot ${index + 1}: Raw data - ${JSON.stringify(shot).substring(0, 100)}`);
                    }
                } catch (e) {
                    console.log(`  Shot ${index + 1}: Decode error - ${e.message}`);
                    console.log(`    Shot type: ${typeof shot}, value: ${JSON.stringify(shot).substring(0, 50)}...`);
                }
            });
        }
        
        if (data.shots_invalid && data.shots_invalid.length > 0) {
            console.log(`\nInvalid shots: ${data.shots_invalid.length}`);
        }
        
        if (data.profiles) {
            console.log(`\nProfiles: ${Object.keys(data.profiles).length}`);
        }
        
        if (data.score_string) {
            console.log(`\nScore string: ${data.score_string.substring(0, 100)}...`);
        }
        
    } catch (e) {
        console.log(`Parse error: ${e.message}`);
        console.log(`Content preview: ${content.substring(0, 200)}...`);
    }
}

// Main function
function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Examine specific string file
        examine_string_file(args[0]);
    } else {
        // Explore all files
        const analysis = explore_string_files();
        
        // Offer to examine specific files
        console.log(`\nTo examine a specific file, run: node explore_strings.js <string_id>`);
        console.log(`Example: node explore_strings.js ${analysis[0]?.id || '1715436178223'}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    analyze_string_file,
    explore_string_files,
    examine_string_file
};
