// Position Data Transformer

exports.mime = "text/json";

exports.transform = function(data) {
	
	var json = JSON.parse(data);

	var result = json.filter(function(element) {
		return(element.type == 'position')
	})

	return JSON.stringify(result, null, '\t');
}
