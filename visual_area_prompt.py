from comfy_execution.graph_utils import GraphBuilder, Node

class VisualAreaPrompt:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "general_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be concatenated to all other conditionings." }),
                "global_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be applied to the whole image once." }),
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO", 
                "unique_id": "UNIQUE_ID"
            },
        }
    
    OUTPUT_TOOLTIPS = ("Area conditioning","Combined conditioning")
    RETURN_TYPES = ("CONDITIONING","CONDITIONING")
    RETURN_NAMES = ("area_conditioning","combined_conditioning")
    FUNCTION = "run_node"
    OUTPUT_NODE = False
    CATEGORY = "RegionalPrompt"

    def run_node(self, general_conditioning, global_conditioning, extra_pnginfo, unique_id, **kwargs):
        # Get values for the conditioning areas from the extra_pnginfo
        conditioning_areas: list[list[float]] = []
        for node in extra_pnginfo["workflow"]["nodes"]:
            # Chcek proper id
            if node["id"] == int(unique_id):
                conditioning_areas: list[list[float]] = node["properties"]["area_values"]
                break
        # Get the conditionings from kwargs
        conditionings: list = list(kwargs.values())
        # Create graph to evaluate the node
        graph: GraphBuilder = GraphBuilder()
        # Concat all other conditionings (to: (to: (to: general, from cond1), from cond2), from cond3... ... from global)
        last_concat: Node = graph.node("ConditioningConcat", conditioning_to=general_conditioning, conditioning_from=conditionings[0])
        for cond in conditionings[1:]:
            last_concat: Node = graph.node("ConditioningConcat", conditioning_to=last_concat.out(0), conditioning_from=cond)
        combined_conditioning: Node = graph.node("ConditioningConcat", conditioning_to=last_concat.out(0), conditioning_from=global_conditioning)
        # Concat general to all other area conditionings (to: general, from: cond)
        conditionings_general: list = []
        for cond in conditionings:
            conditionings_general.append(graph.node("ConditioningConcat", conditioning_to=general_conditioning, conditioning_from=cond))
        # Apply area with percentage from conditionings
        conditionings_area: list = []
        for i in range(0, len(conditionings_general)):
            cond = conditionings_general[i].out(0)
            area_values: list[float] = conditioning_areas[i]
            conditionings_area.append(graph.node("ConditioningSetAreaPercentage", conditioning=cond, width=area_values[2], height=area_values[3], x=area_values[0], y=area_values[1], strength=area_values[4]))
        # Combine all conditionings together
        last_combine: Node = graph.node("ConditioningCombine", conditioning_1=conditionings_area[0].out(0), conditioning_2=conditionings_area[1].out(0)) 
        for cond in conditionings_area[2:]:
            last_combine: Node = graph.node("ConditioningCombine", conditioning_1=last_combine.out(0), conditioning_2=cond.out(0))
        output: Node = graph.node("ConditioningCombine", conditioning_1=last_combine.out(0), conditioning_2=combined_conditioning.out(0))
        return {
            "result": (output.out(0), combined_conditioning.out(0)),
            "expand": graph.finalize()
        }

