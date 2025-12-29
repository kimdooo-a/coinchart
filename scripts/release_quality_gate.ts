#!/usr/bin/env ts-node

/**
 * Release Quality Gate
 * 
 * Checks the status of the PREVIOUS release to ensure it was stable.
 * Prerequisite: `gh` CLI must be authenticated.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function runCommand(cmd: string): string {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (error: any) {
        if (error.stderr) {
            console.warn(`Command warning: ${error.stderr.toString().trim()}`);
        }
        throw error;
    }
}

interface ReleaseKPI {
    release_tag: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILURE' | 'ROLLBACK' | 'UNKNOWN';
}

async function main() {
    console.log(`${colors.blue}=== Quality Gate: Checking Previous Release Stability ===${colors.reset}`);

    try {
        // 1. Get Latest Release Tag
        // We want the latest *published* release (not draft).
        // If the current workflow is creating a new release, "last" might be the one we are making if not careful.
        // The validations run BEFORE release creation in Phase 8.2 (validate job). 
        // So `gh release list` should show the PREVIOUS one.

        console.log('Fetching latest release info...');
        const releaseListJson = runCommand('gh release list --limit 1 --json tagName,publishedAt --exclude-drafts');
        const releases = JSON.parse(releaseListJson);

        if (!releases || releases.length === 0) {
            console.log(`${colors.yellow}[SKIP] No previous releases found. First release is allowed.${colors.reset}`);
            process.exit(0);
        }

        const latestTag = releases[0].tagName;
        console.log(`Previous Release: ${latestTag} (${releases[0].publishedAt})`);

        // 2. Download release_kpi.json from that release
        console.log(`Checking for KPI artifact on ${latestTag}...`);

        try {
            // Create temp dir
            const tempDir = '.quality_gate_temp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            runCommand(`gh release download ${latestTag} -p release_kpi.json -D ${tempDir} --clobber`);

            const kpiPath = path.join(tempDir, 'release_kpi.json');
            if (fs.existsSync(kpiPath)) {
                const kpi: ReleaseKPI = JSON.parse(fs.readFileSync(kpiPath, 'utf8'));
                console.log(`KPI Status: ${kpi.status}`);

                // 3. Enforce Strategy
                if (kpi.status === 'SUCCESS') {
                    console.log(`${colors.green}[PASS] Previous release was stable.${colors.reset}`);
                    process.exit(0);
                } else {
                    console.error(`${colors.red}[FAIL] Previous release (${latestTag}) failed or is unstable.${colors.reset}`);
                    console.error(`Status: ${kpi.status}`);
                    console.error('You must fix the production environment or manually mark the previous release as stable before proceeding.');
                    console.error('To Bypass (Emergency): Manually upload a "SUCCESS" release_kpi.json to the existing release.');
                    process.exit(1);
                }
            } else {
                console.log(`${colors.yellow}[WARN] KPI file downloaded but not found on disk?${colors.reset}`);
                process.exit(0); // Fail-open if weird error, or fail-close? Fail-open for now as adoption phase.
            }

        } catch (e: any) {
            // If asset not found, it implies legacy release or KPI system failure.
            // We generally FAIL OPEN for legacy compatibility, but warn.
            const msg = e.toString();
            if (msg.includes('not found') || msg.includes('404')) {
                console.log(`${colors.yellow}[SKIP] No KPI data found for previous release. Assuming legacy/legacy-stable.${colors.reset}`);
                process.exit(0);
            }
            throw e;
        }

    } catch (error) {
        console.error(`${colors.red}[ERROR] Quality Gate Check Failed${colors.reset}`);
        console.error(error);
        // If we can't check, what should we do? 
        // Strict mode: Fail. 
        process.exit(1);
    }
}

main();
