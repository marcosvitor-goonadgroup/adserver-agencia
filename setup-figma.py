#!/usr/bin/env python3

import re
import os
import sys
import shutil

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 setup-figma.py <figma-content-path> <output-code-file> <assets-dir>")
        print("Example: python3 setup-figma.py /home/ubuntu/upload/figma/{fileId}/{frameId}/content/ /home/ubuntu/project/src/pages/Home.tsx /home/ubuntu/project/public")
        sys.exit(1)
    
    figma_content_path = sys.argv[1]
    output_file = sys.argv[2]
    project_assets_dir = sys.argv[3]
    
    # Construct figma paths
    code_file = os.path.join(figma_content_path, 'code.jsx')
    
    # Get output file directory to check if it exists
    output_dir = os.path.dirname(output_file)
    if not os.path.exists(output_dir):
        print(f"Error: Output directory does not exist: {output_dir}")
        sys.exit(1)
    
    # Read the original code
    try:
        with open(code_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File {code_file} not found")
        sys.exit(1)
    
    # Construct figma assets directory path
    figma_assets_dir = os.path.join(figma_content_path, 'assets')
    
    # Check if figma assets directory exists
    if not os.path.exists(figma_assets_dir):
        print(f"Warning: Figma assets directory {figma_assets_dir} not found")
        print("Available assets will be skipped")
        figma_available_assets = []
    else:
        figma_available_assets = os.listdir(figma_assets_dir)
    
    # Ensure project assets directory exists
    if not os.path.exists(project_assets_dir):
        os.makedirs(project_assets_dir, exist_ok=True)
        print(f"Created project assets directory: {project_assets_dir}")
    
    # Create mapping from placeholder URL to asset file
    url_to_asset = {}
    
    # Asset mapping based on the extracted assets
    asset_map = {
        "1:414": "1-414.webp",
        "1:415": "1-415.webp",
        "1:416": "1-416.webp",
        "1:417": "1-417.webp",
        "1:418": "1-418.webp",
        "1:419": "1-419.webp",
        "1:424": "1-424.webp",
        "1:426": "1-426.svg",
        "1:434": "1-434.svg",
        "1:437": "1-437.svg",
        "1:439": "1-439.svg",
        "1:441": "1-441.svg",
        "1:443": "1-443.svg",
        "1:445": "1-445.svg",
        "1:447": "1-447.svg",
        "1:450": "1-450.svg",
        "1:454": "1-454.svg",
        "1:464": "1-464.svg",
        "1:491": "1-491.svg",
        "1:543": "1-543.svg",
        "1:553": "1-553.svg",
        "1:574": "1-574.svg",
        "1:577": "1-577.svg",
        "1:655": "1-655.svg",
        "1:669": "1-669.svg",
        "1:678": "1-678.svg",
        "1:690": "1-690.svg"
    }
    
    # Process each known asset
    for node_id, expected_filename in asset_map.items():
        placeholder_url = f"https://placehold.com/{node_id}"
        
        # Check if the asset file exists in figma assets directory
        figma_asset_path = os.path.join(figma_assets_dir, expected_filename)
        project_asset_path = os.path.join(project_assets_dir, expected_filename)
        
        if os.path.exists(figma_asset_path):
            # Only copy if asset does not already exist in project
            if not os.path.exists(project_asset_path):
                shutil.copy2(figma_asset_path, project_asset_path)
            
            # Reference assets with /filename (public folder style)
            url_to_asset[placeholder_url] = f"/{expected_filename}"
    
    # Find all placeholder URLs in the original content
    import re
    all_placeholder_urls = set(re.findall(r'https://placehold\.com/[^"]+', content))
    
    # Replace placeholder URLs in content
    replacements_made = 0
    replaced_urls = set()
    for url, public_path in url_to_asset.items():
        old_pattern = f'src="{url}"'
        new_pattern = f'src="{public_path}"'
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            replacements_made += 1
            replaced_urls.add(url)
    
    # Determine the component name from output file
    component_name = os.path.splitext(os.path.basename(output_file))[0]
    if component_name == 'index':
        component_name = os.path.basename(os.path.dirname(output_file)).title()
    
    # Create the complete React component (no imports needed for public assets)
    react_component = f'''export default function {component_name}() {{
  return (
    {content}
  )
}}
'''
    
    # Write to specified output file
    with open(output_file, 'w') as f:
        f.write(react_component)
    
    print(f"\n🎉 Asset replacement completed!")
    print(f"   - Assets in map: {len(asset_map)}")
    print(f"   - Assets found in directory: {len(url_to_asset)}")
    print(f"   - Replacements made in code: {replacements_made}")
    print(f"   - Output file: {output_file}")
    
    # Report any issues
    missing_files = len(asset_map) - len(url_to_asset)
    found_but_not_replaced = len(url_to_asset) - replacements_made
    
    # Find placeholder URLs that are still in the code (not replaced)
    unreplaced_placeholders = all_placeholder_urls - replaced_urls
    
    if len(unreplaced_placeholders) > 0:
        print(f"\n⚠️  {len(unreplaced_placeholders)} placeholder(s) remain in code (assets not exported from Figma).")
        print(f"    These assets could not be exported from Figma. In most cases, these are non-visible assets. Hence, you may simply remove the relevant <img> elements from the code.")
        print(f"    If the user asks, politely request the user to provide these assets.")
        print(f"    Unreplaced placeholders:")
        for url in sorted(unreplaced_placeholders):
            node_id = url.replace("https://placehold.com/", "")
            print(f"    - {node_id}")
    
    if found_but_not_replaced > 0:
        print(f"\n💡 Note: {found_but_not_replaced} asset(s) are available but not currently used in the code.")
        print(f"    These assets are ready to use if needed:")
        for url, public_path in url_to_asset.items():
            if url not in replaced_urls:
                # Extract node ID from URL
                node_id = url.replace("https://placehold.com/", "")
                print(f"    - {node_id} → {public_path}")
    
    if len(unreplaced_placeholders) == 0 and found_but_not_replaced == 0:
        print(f"\n✅ All assets processed successfully!")

if __name__ == "__main__":
    main()
