# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- (pending features, see GitHub Issues)

### Changed
- (pending improvements)

### Fixed
- (pending bug fixes)

### Removed
- (pending deprecations)

---

## [v1.0.0] - 2025-12-27

### Added

**Core Features**
- Cryptocurrency price analysis (Bitcoin, Ethereum, Altcoins)
- Technical indicator calculation (SMA, EMA, RSI, MACD, Bollinger Bands)
- Probability-based prediction engine
- Confidence scoring system
- Daily batch analysis automation
- User portfolio tracking
- Pro tier gating (premium feature access)

**Architecture**
- Next.js full-stack application (React + TypeScript)
- Supabase PostgreSQL backend
- Google OAuth authentication
- SSOT (Single Source of Truth) pattern for data flows
- Idempotent batch job design
- Immutable analysis engine

**Batch Automation**
- Daily cron job (market analysis)
- Weekly cron job (report generation)
- Batch analysis orchestrator
- Report generator (Markdown/JSON)
- Alert engine with duplicate prevention (24-hour window)

**Feature Flags**
- `NEXT_PUBLIC_APP_MODE` (dev/staging/prod)
- `NEXT_PUBLIC_DISABLE_AUTOMATION` (batch job kill switch)
- `NEXT_PUBLIC_DISABLE_PRO_GATE` (emergency feature unlock)

**Deployment**
- Vercel deployment integration
- Pre-deployment checks (preflight.ts)
- Post-deployment health checks (healthcheck.ts)
- Environment variable standardization (.env.example)
- Feature gate system (lib/config/gates.ts)
- Comprehensive deployment runbook

**Release Management**
- Semantic versioning policy (SemVer vX.Y.Z)
- Release notes template (locked format)
- Release versioning policy documentation
- GitHub Release integration

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Removed
- N/A (initial release)

---

## Documentation & Notes

### How to Update This Changelog

When preparing a release:

1. Create a new section with `## [vX.Y.Z] - YYYY-MM-DD`
2. Move items from `[Unreleased]` to the new version
3. Include only completed, deployed features
4. Use format: Added / Changed / Fixed / Removed

### When to Add Entries

- **Added**: New features, new commands, new endpoints, new gates
- **Changed**: Behavior modifications, performance improvements, dependency updates
- **Fixed**: Bug fixes, data corruption fixes, security patches
- **Removed**: Deprecated features, deleted endpoints, removed gates

### Format Rules

```markdown
## [vX.Y.Z] - YYYY-MM-DD

### Added
- Feature description (issue #123 if applicable)
- Short format: action + noun

### Changed
- What changed: from X to Y
- Impact: if significant

### Fixed
- Bug description (#456)
- What was broken / What is now fixed

### Removed
- Deprecated feature (use X instead)
- Only if intentional deprecation
```

### Example Entries

```markdown
### Added
- New endpoint: /api/analysis/stock/{symbol} for stock price analysis

### Changed
- Probability calculation: improved from 88% accuracy to 95%
- Cache TTL: increased from 30s to 60s (trades freshness for performance)

### Fixed
- Fixed #789: NaN error when volume = 0
- Fixed #790: memory leak in analysis cache (was leaking 10MB/hour)

### Removed
- Deprecated: legacy news feed API (use /api/news/crypto instead)
```

### What NOT to Include

- ❌ Internal tickets/meetings
- ❌ Work-in-progress items
- ❌ Future plans ("coming soon")
- ❌ Blame or credit struggles
- ❌ Performance claims without numbers

---

## Release Checklist

Before creating a release:

- [ ] CHANGELOG.md updated with version section
- [ ] All changes listed under Added/Changed/Fixed/Removed
- [ ] No [Unreleased] items remain
- [ ] Version format is vX.Y.Z (SemVer)
- [ ] Release date is today's date
- [ ] GitHub Release created with template
- [ ] Preflight checks pass
- [ ] Health checks pass
- [ ] Rollback procedure documented

---

## Related Documents

- [RELEASE_VERSIONING.md](docs/RELEASE_VERSIONING.md) - Version numbering and release policy
- [RELEASE_NOTES_TEMPLATE.md](docs/RELEASE_NOTES_TEMPLATE.md) - Release notes format (locked)
- [DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [PHASE8_DEPLOY_VSCODE_RESULT_20251227.md](PHASE8_DEPLOY_VSCODE_RESULT_20251227.md) - Phase 8 completion report

---

## Version History

| Version | Date | Type | Status |
|---------|------|------|--------|
| v1.0.0 | 2025-12-27 | Initial | Active |

---

**Last Updated**: 2025-12-27  
**Format**: Keep a Changelog  
**Versioning**: Semantic Versioning (SemVer)

