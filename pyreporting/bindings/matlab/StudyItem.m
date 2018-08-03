classdef StudyItem < handle & matlab.mixin.Heterogeneous
    % Abstract base class for handling the individual items that can be
    % uploaded into studies (Images, Tables, etc.)
    methods (Abstract)
        name_value_pairs = getArgNameValuePairs(obj);
        show(obj);

    end

    properties
       name;
       description;
       report_item;
    end

    methods

        function will_show_figure = showsFigure(obj)
            will_show_figure = false;
        end

        function py_arg_list = getDictList(obj)
            py_arg_list = py.list;
            for i=1:length(obj)
                py_arg_list.append(obj(i).getPyDict())
            end
        end

        function py_dict = getPyDict(obj)
            name_value_pairs = obj.getArgNameValuePairs();
            py_dict = py.dict(pyargs(name_value_pairs{:}));
        end


        function report_item = getReportItem(obj)
            % Returns a python ReportItem corresponding to this.
            report_item = py.pyreporting.reports.ReportTextItem(obj.name, ['Basic Item Text' obj.description]);
        end
    end

end
