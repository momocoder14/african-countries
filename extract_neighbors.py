import json

def get_neighbors():
    with open('src/data/africa.topo.json', 'r') as f:
        topo = json.load(f)

    geometries = topo['objects']['africa']['geometries']
    
    # Map from normalized arc index to set of alpha3 codes
    arc_to_alpha3 = {}
    
    # Store all recognized alpha3 codes
    all_alpha3 = set()
    with open('src/data/africa_metadata.json', 'r') as f:
        metadata = json.load(f)
    for info in metadata.values():
        if info.get('alpha3'):
            all_alpha3.add(info['alpha3'])

    # Track which alpha3 each geometry belongs to
    # We might have multiple geometries for one alpha3 (though rare in this file)
    # Or an entity with no alpha3 (Somaliland) that we want to map to SOM
    id_to_alpha3 = {}
    for geom in geometries:
        props = geom.get('properties', {})
        alpha3 = props.get('alpha3')
        name = props.get('name')
        
        if not alpha3:
            # Check metadata for this name
            meta_entry = metadata.get(name)
            if meta_entry:
                alpha3 = meta_entry.get('alpha3')
        
        # Special case for Somaliland in this dataset
        if name == "Somaliland" or geom.get('id') == "ABV":
            alpha3 = "SOM"
            
        if alpha3:
            id_to_alpha3[geom.get('id') or name] = alpha3
        else:
            # Still no alpha3, we'll exclude it from the mapping keys but it might be a neighbor
            # Though all recognized ones should have alpha3.
            pass

    for geom in geometries:
        geom_id = geom.get('id') or geom['properties'].get('name')
        target_alpha3 = id_to_alpha3.get(geom_id)
        if not target_alpha3:
            continue
            
        arcs_list = geom.get('arcs', [])
        
        def flatten_arcs(arcs):
            flat = []
            for item in arcs:
                if isinstance(item, list):
                    flat.extend(flatten_arcs(item))
                else:
                    flat.append(item)
            return flat
            
        flat_arcs = flatten_arcs(arcs_list)
        
        for arc in flat_arcs:
            normalized_arc = arc if arc >= 0 else ~arc
            if normalized_arc not in arc_to_alpha3:
                arc_to_alpha3[normalized_arc] = set()
            arc_to_alpha3[normalized_arc].add(target_alpha3)
            
    neighbors = {alpha3: set() for alpha3 in all_alpha3}
    
    for alpha3_set in arc_to_alpha3.values():
        if len(alpha3_set) > 1:
            for a1 in alpha3_set:
                for a2 in alpha3_set:
                    if a1 != a2:
                        if a1 in neighbors:
                            neighbors[a1].add(a2)
    
    # Convert to sorted lists
    result = {k: sorted(list(v)) for k, v in neighbors.items()}
    return result

if __name__ == "__main__":
    neighbors = get_neighbors()
    print(json.dumps(neighbors, indent=2))
