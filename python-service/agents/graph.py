from langgraph.graph import StateGraph, END
from agents.state import GraphState
from agents.skill_agent    import skill_agent
from agents.rag_agent      import rag_agent
from agents.gap_agent      import gap_agent
from agents.course_agent   import course_agent
from agents.planning_agent import planning_agent

def build_graph():
    # create the graph with our state type
    graph = StateGraph(GraphState)

    # register each agent as a node
    graph.add_node("skill_agent",    skill_agent)
    graph.add_node("rag_agent",      rag_agent)
    graph.add_node("gap_agent",      gap_agent)
    graph.add_node("course_agent",   course_agent)
    graph.add_node("planning_agent", planning_agent)

    # define the flow — each edge says "after this node, go to that node"
    graph.set_entry_point("skill_agent")
    graph.add_edge("skill_agent",    "rag_agent")
    graph.add_edge("rag_agent",      "gap_agent")
    graph.add_edge("gap_agent",      "course_agent")
    graph.add_edge("course_agent",   "planning_agent")
    graph.add_edge("planning_agent", END)

    return graph.compile()

# compile once at import time — reused for every request
roadmap_graph = build_graph()
