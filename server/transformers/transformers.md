# Data Transformers
Transformers are simple scripts that transform the file contents into the desired output format. 

## API
Two functions are expected on a transofmer

	transfomer.mime

returns the mime type string, and 

	transfomer.transform(data)

takes the input data and returns an output data string.