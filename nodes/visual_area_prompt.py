from comfy_execution.graph_utils import GraphBuilder, Node

class VisualAreaPrompt:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
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

    def run_node(self, extra_pnginfo, unique_id, **kwargs):
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
        last_concat: Node = conditionings[0] if len(conditionings) <= 1 else graph.node("ConditioningConcat", conditioning_to=conditionings[0], conditioning_from=conditionings[1])
        # Start loop from the second element (first already concatenated)
        for cond in conditionings[2:]:
            last_concat: Node = graph.node("ConditioningConcat", conditioning_to=last_concat.out(0), conditioning_from=cond)
        # Apply area with percentage from conditionings
        conditionings_area: list = []
        for i in range(len(conditionings)):
            cond = conditionings[i]
            area_values: list[float] = conditioning_areas[i]
            conditionings_area.append(graph.node(
                "ConditioningSetAreaPercentage",
                conditioning=cond,
                width=area_values[2],
                height=area_values[3],
                x=area_values[0],
                y=area_values[1],
                strength=area_values[4]
            ))
        # Combine all conditionings together
        last_combine: Node = conditionings_area[0] if len(conditionings_area) <= 1 else graph.node("ConditioningCombine", conditioning_1=conditionings_area[0].out(0), conditioning_2=conditionings_area[1].out(0))
        # Start loop from the third element (two are already combined)
        for cond in conditionings_area[2:]:
            last_combine: Node = graph.node("ConditioningCombine", conditioning_1=last_combine.out(0), conditioning_2=cond.out(0))
        # Final combination with the previously combined conditioning
        output: Node = graph.node("ConditioningCombine", conditioning_1=last_combine.out(0), conditioning_2=last_concat.out(0))
        # Return result and expanded graph
        return {
            "result": (output.out(0), last_concat.out(0)),
            "expand": graph.finalize()
        }
