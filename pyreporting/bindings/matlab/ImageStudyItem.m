classdef ImageStudyItem < StudyItem
    % This class is responsible for storing and handling all the data and
    % metadata necessary to interface with the Python web for Images
    % uploaded to studies
    properties
        image_path;
        image;
        image_extension = '.png';
        size = StudyConfiguration.DEFAULT_IMAGE_UPLOAD_SIZE;
    end

    methods (Static)
        function study_item = createFromFigure(name, figure, description, make_full_screen)
            if ~exist('make_full_screen', 'var')
                make_full_screen = true;
            end
            if ~exist('description', 'var')
                description = 'No Description Provided';
            end

            if make_full_screen
                Util.makeFullScreen(figure);
            end
            image = getframe(figure);

            % If the figure has a title, use the figure title for the image
            % name, since the figure title tends to be more descriptive
            % than name passed in to this method
            try
                figure_title = figure.CurrentAxes.Title.String;
                % Sometimes a figure title will be a cell array to indicate line breaks
                % TODO: expand name to take into account richer formatting options. But for now
                % Ignore.
                if ~isempty(figure_title) && ~iscell(figure_title)
                    name = figure_title;
                end
            catch
                % Couldn't get a title string since some objects missing
                % Dont change the image name
            end

            % If it is a time series line plot, we can upload its data to
            % the web as well as the image.
            if ImageStudyItem.isTimeSeriesPlot(figure)
                [time_series_data, time_series_names] = extractTimeSeriesFromFigure(figure);
                study_item = TimeSeriesChartStudyItem(name, image, description, time_series_data, time_series_names);
            else
                study_item = ImageStudyItem(name, image, description);
            end
            close(figure);
        end

        function is_time_series_plot = isTimeSeriesPlot(figure_handle)
            try
                axes_obj = figure_handle.CurrentAxes;

                % We have a date x-axis if the scale is linear and the limits
                % are between 1900 and 2050. This is totally arbitrary.
                % TODO: Need a better way to check if we have a time
                % series plot, or just refactor all this eventually
                MIN_DATE_AXIS = datenum('1/1/1900');
                MAX_DATE_AXIS = datenum('12/31/2050');
                is_date_x_axis = strcmpi(axes_obj.XAxis.Scale, 'linear') & ...
                              axes_obj.XAxis.Limits(1) >= MIN_DATE_AXIS & ...
                              axes_obj.XAxis.Limits(2) <= MAX_DATE_AXIS;


                % Have at least some plots
                has_plots = ~isempty(axes_obj.Children);

                % Test of each plot item is a line
                is_line = arrayfun(@(child) isa(child,  'matlab.graphics.chart.primitive.Line'), axes_obj.Children);

                % Do we have all lines with a date x-axis?
                is_time_series_plot = has_plots & all(is_line) & is_date_x_axis;
            catch
                % It isn't a time series plot because the necessary properties
                % were not present (axes, or XAxis, etc)
                is_time_series_plot = false;
            end
        end
    end
    methods

        function obj = ImageStudyItem(name, image, description)
            obj = obj@StudyItem();
            obj.name = name;
            obj.image_path = obj.createFilePath();
            fid = fopen(obj.image_path, 'w'); % Sort of make sure that no other process also grabs this temp file
            fclose(fid);
            obj.setImage(image);
            obj.description = description;
        end

        function report_item = getReportItem(obj)
            obj.saveImageToFile();
            report_item = py.pyreporting.reports.ReportImageItem(obj.name, obj.description, obj.image_path);
        end

        function setImage(obj, image)
            obj.image = image;
        end

        function path = createFilePath(obj)
            path = [tempname obj.image_extension];
        end

        function name_value_pairs = getArgNameValuePairs(obj)
            obj.saveImageToFile();
            name_value_pairs = {'image_path', obj.image_path, 'description', obj.description, 'image_name', obj.name};
        end

        function bitmap = getBMP(obj, image)
            if nargin < 2
                image = obj.image;
            end
            bitmap = image.cdata;
        end

        function setSize(obj, new_size)
            if all(new_size == obj.size)
                return
            end
            if isempty(obj.image)
                obj.size = new_size;
            else
                resized_image = obj.resizeImage(obj.image, new_size);
                obj.image.cdata = resized_image;
                obj.size = new_size;
            end
        end

        function saveImageToFile(obj)
            image_resized = obj.resizeImage(obj.image, obj.size);
            imwrite(image_resized, obj.image_path)
        end

        function delete(obj)
            delete(obj.image_path);
        end

        function bitmap = resizeImage(obj, image,  new_size, interpolation_method)
            if nargin < 4
                interpolation_method = 'cubic';
            end
            pixels = obj.getBMP(image);
            num_layers = size(pixels, 3);
            current_num_rows = size(pixels, 1);
            current_num_columns = size(pixels, 2);
            desired_num_rows = new_size(1);
            desired_num_columns = new_size(2);

            bitmap = zeros(desired_num_rows, desired_num_columns, num_layers);

            row_step = (current_num_rows) / (desired_num_rows);
            col_step = (current_num_columns) / desired_num_columns;
            output_grid_rows = [0:desired_num_rows-1] * row_step + 1;
            output_grid_cols = [0:desired_num_columns-1] * col_step + 1;
            [grid_column_values, grid_row_values] = meshgrid(output_grid_cols, output_grid_rows);
            [current_grid_column_values, current_grid_row_values] = meshgrid(1:current_num_columns, 1:current_num_rows);

            for layer_index = 1:num_layers
                layer = obj.getLayer(pixels, layer_index);
                interpolated_layer = interp2(layer, grid_column_values, grid_row_values, interpolation_method);
                bitmap(:,:, layer_index) = interpolated_layer;
            end
        end

        function layer = getLayer(obj, bitmap, layer_num)
            layer = im2double(bitmap(:,:,layer_num));
        end

        function will_show_figure = showsFigure(obj)
            will_show_figure = true;
        end

        function show(obj)
            imshow(obj.getBMP())
        end
        
    end

end
