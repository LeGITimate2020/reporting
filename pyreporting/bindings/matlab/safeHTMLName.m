% SAFEHTMLNAME takes in a string as input, and returns a version of the
% string that is appropriate to dend in a POST request in HTML.
function safeName = safeHTMLName(name)

    safeName = strrep(name, ' ', '_');
end