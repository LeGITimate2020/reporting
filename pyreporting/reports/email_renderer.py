from pathlib import Path
import time
import re
import imghdr
from logging import getLogger
from typing import Callable

from .plotutils import generate_stacked_bar_plot_figure

from . import ReportTableItem, ReportImageItem, ReportLineGraphItem, ReportFileItem, ReportGraphItem, ReportTextItem
logger = getLogger(__name__)


def send_email(*args, **kwargs):
    raise NotImplementedError('Implement your own logic for sending email')


class EmailReportRenderer:
    def __init__(self, send_email: Callable=send_email):
        '''
        :param send_email: Function that accepts kwargs of:
        * html_content
        * recipients
        * email_subject
        * images
        * files
        '''
        self.send_email = send_email

    def render(self, report, email_addresses, email_subject, output_dir='./report'):
        # Get a unique name for this report
        report_name = report.get_name()
        run_string = time.strftime('%Y%M%d_%H%M%S')

        # Create a sequence of sub-paths to make unique reports by name and time run.
        path = Path('.') / output_dir / report_name / run_string

        if not path.exists():
            path.mkdir(parents=True)
        assert path.exists(), f"Couldn't create directory {path}"

        html_output, image_and_cid_references, file_attachments = self.__to_html_and_images(report, path)
        self.send_email(
            html_content=html_output,
            recipients=email_addresses,
            email_subject=email_subject,
            images=image_and_cid_references,
            files=file_attachments,
        )

    def __to_html_and_images(self, report, output_dir):
        files_path = output_dir / 'Files'
        files_path.mkdir(parents=True)
        assert files_path.exists(), f"Couldn't create directory {files_path}"

        html_items = []
        image_and_cid_references = []
        file_attachments = []

        for unique_id, item in report.get_uniquely_keyed_items():
            html_items.append(self.render_div(f'<h2>{item.name}</h2><br>'))

            if isinstance(item, ReportFileItem):
                self.append_file_item(item, unique_id, files_path, html_items, image_and_cid_references, file_attachments)

            elif isinstance(item, ReportGraphItem):
                self.append_report_graph_item(item, unique_id, files_path, html_items, image_and_cid_references)

            elif isinstance(item, ReportImageItem):
                self.append_image_item(item, unique_id, files_path, image_and_cid_references)

            elif isinstance(item, ReportLineGraphItem):
                self.append_line_graph_item(item, unique_id, files_path, html_items, image_and_cid_references)

            elif isinstance(item, ReportTableItem):
                self.append_table_item(item, html_items)

            elif isinstance(item, ReportTextItem):
                self.append_text_item(item, html_items)

            else:
                report_type = type(item)
                raise NotImplementedError(f'Unexpected report item type {report_type}')

        return ''.join(html_items), image_and_cid_references, file_attachments

    def append_text_item(self, text_item, html_items):
        html_items.append(self.render_div(text_item.render_text_snippet()))

    def append_report_graph_item(self, item, unique_id, destination_path, html_items, image_and_cid_references):
        output_type = item.get_output_type()

        if output_type is ReportGraphItem.LINE:
            self.append_line_graph_item(item, unique_id, destination_path, html_items, image_and_cid_references)

        elif output_type is ReportGraphItem.STACKED:
            fig = generate_stacked_bar_plot_figure(
                item.as_data_frame(),
                title=item.get_name(),
                y_label='Value'
            )
            image_file_path = f'{destination_path}/{unique_id}.png'
            fig.savefig(image_file_path, bbox_inches='tight')

            cid = self.safe_string(unique_id)
            html_items.append(self.render_image(cid=cid))
            image_and_cid_references.append(self.make_filename_cid_reference(image_file_path, cid=cid))

        else:
            raise NotImplementedError(f'Unexpected output type: {output_type}')

    def append_line_graph_item(self, item, unique_id, destination_path, html_items, image_and_cid_references):
        image_file_path = f'{destination_path}/{unique_id}.png'

        df = item.as_data_frame()
        ax = df.plot(kind='line')
        ax.get_figure().savefig(image_file_path, bbox_inches='tight')

        cid = self.safe_string(unique_id)
        html_items.append(self.render_image(cid=cid))
        image_and_cid_references.append(self.make_filename_cid_reference(image_file_path, cid=cid))

    def append_file_item(self, item, unique_id, dest_path, html_items, image_and_cid_references, file_attachments):
        # determine the file type. If it is an image, append and embed as an image and cid reference.
        # if it is a file, append as a file
        file_path = item.copy_to(dest_path, filename=unique_id)
        if imghdr.what(file_path) is not None:
            cid = self.safe_string(unique_id)
            html_items.append(self.render_image(cid))
            image_and_cid_references.append(self.make_filename_cid_reference(file_path, cid=cid))
        else:
            html_items.append(self.render_div(f'See attached file named {item.name}'))
            file_attachments.append(file_path)

    def append_image_item(self, item, unique_id, files_path, image_and_cid_references):
        self.append_file_item(item, unique_id, files_path, image_and_cid_references, file_attachments=[])

    @staticmethod
    def append_table_item(item, html_items):
        df = item.as_data_frame()
        html_items.append(df.to_html())

    @staticmethod
    def make_filename_cid_reference(image_file_path, cid):
        return {'filename': image_file_path, 'cid': cid}

    @staticmethod
    def render_div(div_content):
        return f'<div>{div_content}</div>'

    def render_image(self, cid):
        return self.render_div(f'<img src="cid:{cid}"/>')

    @staticmethod
    def safe_string(s):
        return re.sub('[^0-9a-zA-Z_]', '_', s)
