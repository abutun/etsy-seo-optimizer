#!/usr/bin/env bash
set -euo pipefail

# Etsy SEO Optimizer - Claude Code Skill Installer
# Creates symlinks in ~/.claude/skills/ so slash commands work from any project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
SKILL_NAMES=("etsy-audit" "etsy-analyze" "etsy-competitors" "etsy-update" "etsy-overview")

echo "Etsy SEO Optimizer - Claude Code Skill Installer"
echo "================================================="
echo ""
echo "Project directory: $SCRIPT_DIR"
echo "Skills directory:  $SKILLS_DIR"
echo ""

# Ensure ~/.claude/skills/ exists
mkdir -p "$SKILLS_DIR"

# Install npm dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "Installing npm dependencies..."
  (cd "$SCRIPT_DIR" && npm install)
  echo ""
fi

# Generate and install each skill with absolute paths
for skill in "${SKILL_NAMES[@]}"; do
  SKILL_SOURCE="$SCRIPT_DIR/skills/$skill/SKILL.md"
  SKILL_TARGET_DIR="$SKILLS_DIR/$skill"
  SKILL_TARGET="$SKILL_TARGET_DIR/SKILL.md"

  if [ ! -f "$SKILL_SOURCE" ]; then
    echo "WARNING: Source skill not found: $SKILL_SOURCE"
    continue
  fi

  mkdir -p "$SKILL_TARGET_DIR"

  # Read the original SKILL.md and inject the absolute project path
  # Replace relative "npx tsx src/" with absolute "cd /path && npx tsx src/"
  sed "s|npx tsx src/|cd $SCRIPT_DIR \&\& npx tsx src/|g" "$SKILL_SOURCE" > "$SKILL_TARGET"

  echo "Installed: /$skill -> $SKILL_TARGET"
done

# Also install the main etsy-seo skill
MAIN_SKILL_DIR="$SKILLS_DIR/etsy-seo"
mkdir -p "$MAIN_SKILL_DIR"
sed "s|npx tsx src/|cd $SCRIPT_DIR \&\& npx tsx src/|g" \
  "$SCRIPT_DIR/.claude/skills/etsy-seo/SKILL.md" > "$MAIN_SKILL_DIR/SKILL.md"
echo "Installed: /etsy-seo (main skill) -> $MAIN_SKILL_DIR/SKILL.md"

# Copy reference docs alongside the main skill
if [ -d "$SCRIPT_DIR/references" ]; then
  cp -r "$SCRIPT_DIR/references" "$MAIN_SKILL_DIR/"
  echo "Installed: references -> $MAIN_SKILL_DIR/references/"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in your Etsy API credentials:"
echo "     cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env"
echo ""
echo "  2. Authenticate with Etsy:"
echo "     cd $SCRIPT_DIR && npx tsx src/auth/server.ts"
echo ""
echo "  3. Start using the skills in any Claude Code session:"
echo "     /etsy-overview    - Shop dashboard"
echo "     /etsy-audit       - Full SEO audit"
echo "     /etsy-analyze     - Deep listing analysis"
echo "     /etsy-competitors - Competitor research"
echo "     /etsy-update      - Update a listing"
echo ""
echo "To uninstall, run: bash $SCRIPT_DIR/uninstall.sh"
