"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Float, String, Scope

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
    has_children = True

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the SimpleMapXBlock, shown to students
        when viewing courses.
        """

        marker_img_path = self.runtime.local_resource_url(self, f"public/img/")#{self.marker_icon}")
        html = self.resource_string("public/simplemap.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("public/dist/simplemap.css"))
        frag.add_javascript(self.resource_string("public/dist/simplemap.js"))
        frag.initialize_js('SimpleMapXBlock', json_args={"marker_image_path": marker_img_path, "marker_icon": self.marker_icon, "markers":[{"usage_id": child.scope_ids.usage_id, "title": child.title, "lat": child.lat, "long": child.long} for child in self.get_children() if isinstance(child, MapMarkerXBlock)]})
        #  [child if isinstance(child, MapMarkerXBlock) for child in 
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=''):
        """
        An example handler, which increments the data.
        """
        # Just to show data coming in...
        assert data['hello'] == 'world'

        self.count += 1
        return {"count": self.count}
    
    @classmethod
    def parse_xml(cls, node, runtime, keys, id_generator):
        block = runtime.construct_xblock_from_class(cls, keys)
        for child in node:
            block.runtime.add_node_as_child(block, child, id_generator)

        # Attributes become fields.
        for name, value in node.items():  # lxml has no iteritems
            cls._set_field_if_present(block, name, value, {})

        text = node.text
        if text:
            text = text.strip()
            if text:
                block.question = text
        return block

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("SimpleMapXBlock",
             """<simplemap>
                 <mapmarker title="Bundestag" lat="52.518623" long="13.376198"/>
                 <mapmarker title="Charite" lat="52.522664576" long="13.374498502"/>
                 <mapmarker title="Campus Benjamin Franklin" lat="52.440641" long="13.318494"/>
                </simplemap>
             """),
            ("Multiple SimpleMapXBlock",
             """<vertical_demo>
                <simplemap/>
                <simplemap/>
                <simplemap/>
                </vertical_demo>
             """),
        ]

class MapMarkerXBlock(XBlock):
    title = String(help=_("Title of the marker"), scope=Scope.content, default=_("Marker"))
    lat = Float(help=_("Latitude"), scope=Scope.content, default=None)
    long = Float(help=_("Longitude"), scope=Scope.content, default=None)
    #html_body = String(help=_("Body of the marker, HTML supported"), scope=Scope.content, default="")

    def student_view(self, context=None):
        return None
