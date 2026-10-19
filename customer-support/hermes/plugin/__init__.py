from .fmi_support.sales_runtime import handle_sales
from .fmi_support.handover import dispatch
from .fmi_support.conversation import before_reply, transform_reply, after_reply


def register(ctx):
    ctx.register_hook("post_gateway_admission", handle_sales)
    ctx.register_hook("pre_gateway_dispatch", dispatch)
    ctx.register_hook("pre_llm_call", before_reply)
    ctx.register_hook("transform_llm_output", transform_reply)
    ctx.register_hook("post_llm_call", after_reply)
