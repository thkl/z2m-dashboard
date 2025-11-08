#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m'
};

const severityColors = {
  Critical: colors.bgRed + colors.white,
  High: colors.red,
  Medium: colors.yellow,
  Low: colors.blue,
  Info: colors.cyan,
  Unknown: colors.dim
};

function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

function printSeverity(severity) {
  const color = severityColors[severity] || severityColors.Unknown;
  return color + colors.bright + ` ${severity.toUpperCase()} ` + colors.reset;
}

function analyzeSastReport(filePath, options = {}) {
  try {
    // Read the SAST report
    const reportPath = path.resolve(filePath);
    if (!fs.existsSync(reportPath)) {
      console.error(colors.red + `Error: File not found: ${reportPath}` + colors.reset);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const vulnerabilities = data.vulnerabilities || [];

    // Filter by severity if specified
    let filteredVulns = vulnerabilities;
    if (options.severity) {
      const severities = options.severity.split(',').map(s => s.trim());
      filteredVulns = vulnerabilities.filter(v => 
        severities.some(s => s.toLowerCase() === v.severity.toLowerCase())
      );
    }

    // Summary
    printHeader(`SAST Report Analysis`);
    console.log(colors.bright + 'Scan Information:' + colors.reset);
    console.log(`  Scanner: ${data.scanner?.name || 'Unknown'} v${data.scanner?.version || 'N/A'}`);
    console.log(`  Scan Date: ${data.scan?.end_time || 'N/A'}`);
    console.log(`  Total Vulnerabilities: ${colors.bright}${vulnerabilities.length}${colors.reset}`);
    
    if (options.severity) {
      console.log(`  Filtered by severity: ${options.severity}`);
      console.log(`  Showing: ${colors.bright}${filteredVulns.length}${colors.reset} vulnerabilities`);
    }

    // Count by severity
    const severityCounts = {};
    vulnerabilities.forEach(v => {
      severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
    });

    console.log('\n' + colors.bright + 'Severity Breakdown:' + colors.reset);
    ['Critical', 'High', 'Medium', 'Low', 'Info', 'Unknown'].forEach(severity => {
      const count = severityCounts[severity] || 0;
      if (count > 0) {
        console.log(`  ${printSeverity(severity)}: ${count}`);
      }
    });

    // Group by file if requested
    if (options.groupByFile) {
      printHeader('Vulnerabilities by File');
      const byFile = {};
      filteredVulns.forEach(v => {
        const file = v.location?.file || 'Unknown';
        if (!byFile[file]) byFile[file] = [];
        byFile[file].push(v);
      });

      Object.entries(byFile)
        .sort(([, a], [, b]) => b.length - a.length)
        .forEach(([file, vulns]) => {
          console.log(`\n${colors.bright}${colors.blue}📄 ${file}${colors.reset} (${vulns.length} issues)`);
          vulns.forEach(v => {
            console.log(`  ${printSeverity(v.severity)} Line ${v.location?.start_line || '?'}: ${v.message?.substring(0, 80)}`);
          });
        });
    } else {
      // Detailed list
      printHeader('Detailed Findings');
      
      if (filteredVulns.length === 0) {
        console.log(colors.green + '✓ No vulnerabilities found matching the criteria!' + colors.reset);
      }

      filteredVulns.forEach((vuln, index) => {
        console.log(`${colors.bright}${index + 1}. ${printSeverity(vuln.severity)} ${vuln.name || vuln.id}${colors.reset}`);
        console.log(`   ${colors.dim}Rule: ${vuln.id}${colors.reset}`);
        console.log(`   ${colors.blue}📄 ${vuln.location?.file}:${vuln.location?.start_line || '?'}${colors.reset}`);
        
        if (vuln.message) {
          console.log(`   ${colors.white}${vuln.message}${colors.reset}`);
        }
        
        if (vuln.solution) {
          console.log(`   ${colors.green}💡 Fix: ${vuln.solution}${colors.reset}`);
        }

        if (options.verbose && vuln.description) {
          console.log(`   ${colors.dim}${vuln.description}${colors.reset}`);
        }

        if (options.verbose && vuln.identifiers?.length > 0) {
          console.log(`   ${colors.dim}Identifiers: ${vuln.identifiers.map(i => i.value).join(', ')}${colors.reset}`);
        }
        
        console.log('');
      });
    }

    // Statistics
    if (options.stats) {
      printHeader('Statistics');
      
      const rules = {};
      vulnerabilities.forEach(v => {
        rules[v.id] = (rules[v.id] || 0) + 1;
      });

      console.log(colors.bright + 'Top Rules Triggered:' + colors.reset);
      Object.entries(rules)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([rule, count]) => {
          console.log(`  ${count}x ${rule}`);
        });
    }

    console.log('\n' + colors.dim + '─'.repeat(80) + colors.reset);
    console.log(colors.bright + 'Summary: ' + colors.reset + 
      `${severityCounts.Critical || 0} Critical, ` +
      `${severityCounts.High || 0} High, ` +
      `${severityCounts.Medium || 0} Medium, ` +
      `${severityCounts.Low || 0} Low`
    );
    console.log(colors.dim + '─'.repeat(80) + colors.reset + '\n');

    // Exit with error code if critical or high vulnerabilities found
    if (options.failOn) {
      const failSeverities = options.failOn.split(',').map(s => s.trim().toLowerCase());
      const hasFailures = vulnerabilities.some(v => 
        failSeverities.includes(v.severity.toLowerCase())
      );
      if (hasFailures) {
        console.error(colors.red + `❌ Found vulnerabilities matching fail-on criteria: ${options.failOn}` + colors.reset);
        process.exit(1);
      }
    }

  } catch (error) {
    console.error(colors.red + 'Error reading or parsing SAST report:' + colors.reset);
    console.error(error.message);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    severity: null,
    groupByFile: false,
    verbose: false,
    stats: false,
    failOn: null
  };
  
  let filePath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--severity' || arg === '-s') {
      options.severity = args[++i];
    } else if (arg === '--group-by-file' || arg === '-g') {
      options.groupByFile = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--stats') {
      options.stats = true;
    } else if (arg === '--fail-on') {
      options.failOn = args[++i];
    } else if (!arg.startsWith('-')) {
      filePath = arg;
    }
  }

  return { filePath, options };
}

function printHelp() {
  console.log(`
${colors.bright}SAST Report Analyzer${colors.reset}

${colors.bright}Usage:${colors.reset}
  node analyze-sast.js [options] <report-file>

${colors.bright}Options:${colors.reset}
  -h, --help              Show this help message
  -s, --severity <level>  Filter by severity (Critical,High,Medium,Low,Info)
  -g, --group-by-file     Group vulnerabilities by file
  -v, --verbose           Show additional details
  --stats                 Show statistics about rules
  --fail-on <severities>  Exit with error code if specified severities found
                          (useful for CI/CD pipelines)

${colors.bright}Examples:${colors.reset}
  ${colors.dim}# View all vulnerabilities${colors.reset}
  node analyze-sast.js gl-sast-report.json

  ${colors.dim}# Show only Critical and High${colors.reset}
  node analyze-sast.js --severity Critical,High gl-sast-report.json

  ${colors.dim}# Group by file${colors.reset}
  node analyze-sast.js --group-by-file gl-sast-report.json

  ${colors.dim}# Show statistics${colors.reset}
  node analyze-sast.js --stats gl-sast-report.json

  ${colors.dim}# Fail CI pipeline if Critical issues found${colors.reset}
  node analyze-sast.js --fail-on Critical gl-sast-report.json
  `);
}

// Main execution
const { filePath, options } = parseArgs();

if (!filePath) {
  console.error(colors.red + 'Error: Please provide a SAST report file' + colors.reset);
  console.log('Run with --help for usage information');
  process.exit(1);
}

analyzeSastReport(filePath, options);