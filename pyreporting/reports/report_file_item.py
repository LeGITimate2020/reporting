from . import ReportItem

from pathlib import Path
from shutil import copyfileobj


class ReportFileItem(ReportItem):

    # Can be given a file-like object, and can be provided with an extension in the case of an in-memory file.
    def __init__(self, name, description, file_obj, extension=None):
        super(ReportFileItem, self).__init__(name, description)

        # Open the file automagically if someone provided a filename
        if isinstance(file_obj, str) or isinstance(file_obj, Path):
            filepath = Path(file_obj)
            assert filepath.exists()
            file_obj = open(file_obj, 'rb')

        self.file_obj = file_obj
        self.extension = extension

        if hasattr(file_obj, 'name') and file_obj.name is not None:
            implied_extension = Path(file_obj.name).suffix

            # If there is an implied extension, it should match the provided extension.
            assert self.extension is None or implied_extension is None or self.extension == implied_extension
            self.extension = implied_extension

    def render_text_snippet(self):
        return self.get_description()

    def copy_to(self, output_path, filename=None):
        ''' Copies the file to the provided path and optional filename and returns the path. '''
        if not filename or len(filename) == 0:
            filename = self.name
        filename += self.extension

        file_path = Path(output_path) / filename
        assert (not file_path.exists())
        self.file_obj.seek(0)

        # write in binary mode if the input was in binary mode.
        mode = 'w'
        if hasattr(self.file_obj, 'mode') and 'b' in self.file_obj.mode:
            mode = 'wb'

        with open(file_path, mode) as output_file:
            copyfileobj(self.file_obj, output_file)

        return file_path
