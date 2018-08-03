classdef MovieStudyItem < ImageStudyItem
    %MOVIESTUDYITEM is responsible for storing different numbers of frames,
    %converting them into a gif and uploading them to the web when
    %required.
    properties
        num_colors = 256;
        color_map;
        num_loops = inf;
    end

    methods
        
        function obj = MovieStudyItem(name, description)
            obj = obj@ImageStudyItem(name, [], description);
            obj.image_extension = 'gif';
            obj.color_map = [];
            obj.size = StudyConfiguration.DEFAULT_MOVIE_FRAME_SIZE;
        end
        
        function addFrame(obj, frame)
            new_image_bitmap = im2double(obj.getBMP(frame));
            if size(new_image_bitmap, 3) == 3 % Then the frame is an RGB matrix presumably, so need to convert it to 
                [converted_pixels, map] = obj.convertRGBToGrey(new_image_bitmap);
                image = frame;
                image.cdata = uint16(converted_pixels);
                obj.color_map = map;
            else
                image = frame; %Might need to do some more processing on the frame here
            end
            if isempty(obj.image)
                obj.setImage(image);
            else
                image_pixels = obj.getBMP(obj.image);
                current_size = [size(image_pixels, 1), size(image_pixels, 2)];
                resized_image = obj.resizeImage(image, current_size);
                obj.image.cdata(:,:,end+1) = resized_image;
            end
        end
        
        function [grayscale, map] = convertRGBToGrey(obj, rgb_im)
            if isempty(obj.color_map)
                [grayscale, map] = rgb2ind(rgb_im, obj.num_colors);
            else
                grayscale = rgb2ind(rgb_im, obj.color_map);
                map = obj.color_map;
            end
        end
              
        function saveImageToFile(obj)
            assert(~isempty(obj.image), ['Tried to save a gif ' obj.name ' but there was no image data!'])
            pixels = uint8(obj.resizeImage(obj.image, obj.size));
            
            num_frames = size(pixels, 3);
            imwrite(pixels(:,:,1), obj.color_map, obj.image_path, obj.image_extension, 'Loopcount', obj.num_loops);
            for frame = 2:num_frames
                imwrite(pixels(:,:,frame), obj.color_map, obj.image_path, obj.image_extension, 'WriteMode', 'append');
            end
            
        end
        
        function layer = getLayer(obj, bitmap, layer_num)
            layer = double(bitmap(:,:,layer_num));
        end
        
    end

end

