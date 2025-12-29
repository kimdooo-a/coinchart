#!/usr/bin/env ts-node

/**
 * KPI Collector Script
 * 
 * Aggregates deployment data into a single KPI JSON file.
 * Usage: tsx scripts/collect_kpi.ts [artifact_root_path]
 * Default artifact_root_path is ./artifacts
 */

import fs from 'fs';
import path from 'path';

// Types tailored to the artifacts we expect
interface DeploymentInfo {
    deployment_url: string;
    deployment_id: string;
    timestamp: string;
    release_tag: string;
}

interface HealthcheckStatus {
    status: 'healthy' | 'unhealthy' | 'unknown';
    timestamp: string;
    deployment_url: string;
    health_duration?: number;
}

interface ReleaseKPI {
    release_tag: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILURE' | 'ROLLBACK' | 'UNKNOWN';
    metrics: {
        deploy_duration_ms: number; // Placeholder, as we might not have start time in artifact
        healthcheck_duration_ms: number;
        incident_count: number;
    };
    details: {
        deployment_url: string;
        health_status: string;
    };
}

async function main() {
    const artifactRoot = process.argv[2] || './artifacts';
    console.log(`Collecting KPI data from: ${artifactRoot}`);

    const deployInfoPath = path.join(artifactRoot, 'deployment-info', 'deployment_info.json');
    const healthPath = path.join(artifactRoot, 'healthcheck-results', 'status.json');

    // Note: We might also check for rollback-report/kill_switch_incident.md or deployment-summary/deployment_summary.txt to determine final status closer to valid truth.
    // For Phase 10, we will infer from healthcheck + deployment info.

    let deployInfo: DeploymentInfo | null = null;
    let healthInfo: HealthcheckStatus | null = null;
    let isKillSwitch = false;

    // 1. Read Deployment Info
    if (fs.existsSync(deployInfoPath)) {
        try {
            deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
        } catch (e) {
            console.error('Failed to parse deployment_info.json');
        }
    } else {
        console.warn('deployment_info.json not found');
    }

    // 2. Read Healthcheck Info
    if (fs.existsSync(healthPath)) {
        try {
            healthInfo = JSON.parse(fs.readFileSync(healthPath, 'utf8'));
        } catch (e) {
            console.error('Failed to parse status.json');
        }
    } else {
        console.warn('status.json not found');
    }

    // 3. Check for Rollback/Kill-Switch evidence
    // The 'rollback-report' artifact usually contains kill_switch_incident.md
    // The workflow sets a specific summary status, let's look for deployment_summary used in release-deploy.yml
    // But strictly, let's use the core indicators.

    if (!deployInfo) {
        console.error('CRITICAL: Missing deployment info. Cannot generate valid KPI.');
        process.exit(1);
    }

    // Determine Status
    let status: ReleaseKPI['status'] = 'UNKNOWN';

    if (healthInfo?.status === 'healthy') {
        status = 'SUCCESS';
    } else if (healthInfo?.status === 'unhealthy') {
        // Check if rollback happened (we'd need previous deployment artifact or inference)
        // For now, if unhealthy, it's at least a FAILURE of compliance. 
        // If we assume the workflow handled rollback, we might differentiate.
        // Let's look for evidence of rollback in deployment artifacts if we saved them... 
        // Actually, Phase 8.4 only saves deployment-info and healthcheck-results and rollback-report.

        // Check for rollback report
        const rollbackReportPath = path.join(artifactRoot, 'rollback-report', 'kill_switch_incident.md');
        if (fs.existsSync(rollbackReportPath)) {
            status = 'FAILURE'; // Manual Action Required
            isKillSwitch = true;
        } else {
            // If unhealthy but NO kill switch report, means rollback might have succeeded or job didn't finish.
            // But wait, Phase 8.4 logic: Rollback job runs if healthcheck fails.
            // IF rollback succeeds -> status=ROLLED BACK.
            // IF rollback fails -> status=FAILED -> uploads kill_switch_incident.md

            // We don't have an explicit 'rollback-success' artifact in the list from Phase 8.4 (we have deployment-summary but that's text).
            // Let's infer: Unhealthy = FAILURE because even a rollback means the *Release* failed (it didn't stick).
            // The Quality Gate should block new releases if the OLD one wasn't stable.
            // A Rollback means the old one is back (stable), so technically the ENV is safe, but the RELEASE (Commit) was bad.
            // So Status = FAILURE is correct for the KPI of *this* release.
            status = 'FAILURE';
        }
    }

    const kpi: ReleaseKPI = {
        release_tag: deployInfo.release_tag,
        timestamp: new Date().toISOString(),
        status: status,
        metrics: {
            deploy_duration_ms: 0, // Not easily captured without start time logs
            healthcheck_duration_ms: healthInfo?.health_duration || 0,
            incident_count: isKillSwitch ? 1 : 0
        },
        details: {
            deployment_url: deployInfo.deployment_url,
            health_status: healthInfo?.status || 'unknown'
        }
    };

    console.log('Generated KPI:', JSON.stringify(kpi, null, 2));

    // Write to artifacts/release_kpi.json
    const outputPath = path.join(artifactRoot, 'release_kpi.json');
    fs.writeFileSync(outputPath, JSON.stringify(kpi, null, 2));
    console.log(`Saved KPI to ${outputPath}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
