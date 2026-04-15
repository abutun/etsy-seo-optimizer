#!/usr/bin/env bash
set -euo pipefail

# Etsy SEO Optimizer - Claude Code Skill Uninstaller
# Removes skills from ~/.claude/skills/

SKILLS_DIR="$HOME/.claude/skills"
SKILL_NAMES=("etsy-audit" "etsy-analyze" "etsy-competitors" "etsy-update" "etsy-overview" "etsy-seo")

echo "Etsy SEO Optimizer - Uninstaller"
echo "================================"
echo ""

for skill in "${SKILL_NAMES[@]}"; do
  TARGET="$SKILLS_DIR/$skill"
  if [ -d "$TARGET" ]; then
    rm -rf "$TARGET"
    echo "Removed: $TARGET"
  else
    echo "Not found (skipping): $TARGET"
  fi
done

echo ""
echo "Uninstall complete. Skills have been removed from Claude Code."
echo "The project files and data remain untouched in the original directory."
