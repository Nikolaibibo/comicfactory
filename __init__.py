from .comic import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

import os
import server
from aiohttp import web

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

@server.PromptServer.instance.routes.get("/comic")
def deungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

server.PromptServer.instance.routes.static("/comic/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/comic/js/", path=os.path.join(WEBROOT, "js"))
server.PromptServer.instance.routes.static("/comic/img/", path=os.path.join(WEBROOT, "img"))

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
