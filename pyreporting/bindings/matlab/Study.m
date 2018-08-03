classdef Study < handle

    properties
        study_name;
        run_name;
        study_items = [];
        request_builder;
        report; % The Python report object, used for local rendering and uploading.
    end

    methods
        function delete(obj)
            % Delete the report object first, before attempting to delete
            % Matlab Study items so that all file handles are closed
            % properly.
           obj.report = [];
        end

        function addStudyItems(obj, items)
            for index = 1:length(items)
                item = items(index);
                obj.report.add_item(item.getReportItem());
            end
            if isempty(obj.study_items)
                obj.study_items = items(:);
            else
                obj.study_items = [obj.study_items; items(:)];
            end
        end

        function merge(obj, study)
            for index = 1:length(study.study_items)
                item = study.study_items(index);
                obj.report.add_item(item.getReportItem())
            end

            obj.study_items = [obj.study_items; study.study_items];
        end

        function show(obj)
            py.pyreporting.reports.BokehReportRenderer().render(obj.report)
        end

        function show_in_matlab(obj)
            is_image = arrayfun(@(t) t.showsFigure(), obj.study_items);
            number_of_images = sum(is_image);
            image_numbers = cumsum(is_image);
            fig = figure;
            Util.makeFullScreen(fig);
            for i = 1:length(obj.study_items)
                if is_image(i)
                    fig = subplot(round((number_of_images+1) / 2), 2, image_numbers(i));
                    obj.study_items(i).show();
                else
                    obj.study_items(i).show();
                end
            end
        end
    end
end
