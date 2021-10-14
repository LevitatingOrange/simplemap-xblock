"""TO-DO: Write a description of what this XBlock is."""

from copy import Error
import dataclasses
import pkg_resources
import logging
from lxml import etree
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Float, String, Scope, Dict
from xblock.exceptions import JsonHandlerError
from dataclasses import dataclass
from dataclasses_json import dataclass_json
import uuid

log = logging.getLogger(__name__)



# TODO: translations
def _(text):
    return text

class SimpleMapXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    marker_icon = String(
        display_name=_("Marker icon"),
        help=_("Name of the image file that will be used for the markers"),
        scope=Scope.content,
        default=""
    )
    lat = Float(help=_("Latitude of map center"), scope=Scope.content, default=52.520008)
    long = Float(help=_("Longitude of map center"), scope=Scope.content, default=13.404954)
    zoom = Float(help=_("Initial zoom level"), scope=Scope.content, default=12.0)
    markers = Dict(help=_("Markers"), scope=Scope.content, default={}) 
    has_children = True
    #has_author_view = True

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def make_view(self, editable, context=None):
        marker_img_path = self.runtime.local_resource_url(self, f"public/img/")#{self.marker_icon}")
        html = self.resource_string("public/simplemap.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("public/dist/simplemap.css"))
        frag.add_javascript(self.resource_string("public/dist/simplemap.js"))
        frag.initialize_js('SimpleMapXBlock', json_args={"editable": editable, "center_lat": self.lat, "center_long": self.long, "initial_zoom": self.zoom, "marker_image_path": marker_img_path, "marker_icon": self.marker_icon, "markers": self.markers})
        #  [child if isinstance(child, MapMarkerXBlock) for child in 
        return frag



    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the SimpleMapXBlock, shown to students
        when viewing courses.
        """
        return self.make_view(False, context=context)

    def studio_view(self, context=None):
        return self.make_view(True, context=context)

    @XBlock.json_handler
    def change_marker(self, data, suffix=''):
        #BIG FIXME: check if user is actually able to edit
        if "marker_id" not in data or not data["marker_id"]:
            raise JsonHandlerError(400, "ID for marker is missing!")

        id = data["marker_id"]
        if id not in self.markers:
            raise JsonHandlerError(400, f"Marker with id {id} does not exist!")
        # TODO check if children id does not exist 

        data.pop("marker_id")
        self.markers[id].update(data)
        return {"success": True}
     
    @XBlock.json_handler
    def add_marker(self, data, suffix=''):
        #BIG FIXME: check if user is actually able to edit
        for attribute in ["title", "lat", "long"]:
            if attribute not in data or not data[attribute]:
                raise JsonHandlerError(400, f"{attribute} for marker is missing!")
        if "content" not in data:
            raise JsonHandlerError(400, "content for marker is missing!")

        new_marker_id = str(uuid.uuid4()) 
        marker = Marker(**data)
        self.markers[new_marker_id] = dataclasses.asdict(marker)

        return {"success": True, "marker_id": new_marker_id}
    
    @XBlock.json_handler
    def delete_marker(self, data, suffix=''):
        #BIG FIXME: check if user is actually able to edit
        if "marker_id" not in data or not data["marker_id"]:
            raise JsonHandlerError(400, "ID for child is missing!")

        del self.markers[data["marker_id"]]

        return {"success": True}
    
    @XBlock.json_handler
    def set_center(self, data, suffix=''):
        print(data)
        #BIG FIXME: check if user is actually able to edit
        if "lat" in data and data["lat"]:
            self.lat = data["lat"]
        if "long" in data and data["long"]:
            self.long = data["long"]
        if "zoom" in data and data["zoom"]:
            self.zoom = data["zoom"]

        return {"success": True}
    
    @classmethod
    def parse_xml(cls, node, runtime, keys, id_generator):
        """
        Test
        """
        block = runtime.construct_xblock_from_class(cls, keys)

        for child in node:
            if child.tag != "mapmarker":
                raise Error("Map should only contain mapmarker children")
            marker_id = child.get("id")
            marker_content = ""
            for marker_child in child:
                marker_content += etree.tostring(marker_child, encoding="unicode")

            marker = Marker(title=child.get("title"), lat=child.get("lat"), long=child.get("long"), content=marker_content)
            block.markers[marker_id] = dataclasses.asdict(marker)

        return block

    def add_xml_to_node(self, node):
        """
        Taken from https://github.com/edx/xblock-sdk/blob/master/sample_xblocks/basic/content.py
        Set attributes and children on `node` to represent ourselves as XML.
        We parse our HTML content, and graft those nodes onto `node`.
        """
        node.tag = "simplemap"

        for (id, marker) in self.marker:
            # A bit ugly, but the dataclass won't be serialized as json by xblock runtime
            html_content = etree.fromstring(marker.content, encoding="unicode")
            marker_xml = etree.SubElement(node, "mapmarker", id=id, **marker)
            marker_xml.append(html_content)

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("SimpleMapXBlock",
             """<simplemap lat="52.520008" long="13.404954" zoom="12">
                 <mapmarker id="1b0cd004-8702-4411-a889-ca97afaf0d39" title="Bundestag" lat="52.518623" long="13.376198">
                 </mapmarker>
                 <mapmarker id="f97b2a72-846c-4967-8480-6eab073665fd" title="Charite" lat="52.522664576" long="13.374498502">
                 </mapmarker>
                 <mapmarker id="1d584a6b-546c-4bd8-8638-c9ee1c8272b4" title="Campus Benjamin Franklin" lat="52.440641" long="13.318494">
                 </mapmarker>
                </simplemap>
             """),
            #("Multiple SimpleMapXBlock",
            # """<vertical_demo>
            #    <simplemap/>
            #    <simplemap/>
            #    <simplemap/>
            #    </vertical_demo>
            # """),
        ]

@dataclass
class Marker:
    title: str
    lat: float
    long: float
    content: str
