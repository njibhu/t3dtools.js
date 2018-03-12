/*
 * For now it does copy a lot of the data because the C++ cannot access JS memory, 
 * so we have to copy everything. But JS can read C++ memory.
 * So, future plans are to integrate with LocalReader and read the datastream directly
 * into c++ memory so there is 0 copy.
 */

/**
 * This function is a multitool to replace the t3dgw2tools binary.
 * @method inflate
 * @param  {ArrayBuffer}    inputBuffer  Buffer containing the input data
 * @param  {number}         extractSize  Can limit the extraction size, a too
 *                                       big value will be shrinken down.
 * @param  {boolean}        isImage      Will decode the image format.
 * @return {Object}  Object containing an output buffer, and image infos
 * 
 * The return object have the following fields:
 * - {ArrayBuffer}  object.data
 * - {number}       object.dxtType  (only existing if isImage = true)
 * - {number}       object.imgW     width (only existing if isImage = true)
 * - {number}       object.imgH     height (only existing if isImage = true)
 */
function inflate(inputBuffer, extractSize, isImage){
    if(extractSize < 1 ) throw new Error("Incorrect size");

    var inflate_value = {};

    //Copy (js) input buffer into C++ memory
    var input = Module._malloc(inputBuffer.length);
    Module.writeArrayToMemory(inputBuffer, input);

    //Make an integer reference to get the size of the extracted buffer
    var pOutputSize = Module._malloc(4);
    Module.setValue(pOutputSize, extractSize, 'i32');

    //Make an integer reference to check for errors
    var pErrors = Module._malloc(1);

    //Call the C++ code, returns the adress of the output buffer
    var output = Module.ccall('inflate', 'i8*', ['i32', 'i8*', 'i32*', 'i8*'], [inputBuffer.length, input, pOutputSize, pErrors]);
    //Check for errors
    var errors = Module.getValue(pErrors, 'i8');
    if(errors != 0){
        cleanup([input, pOutputSize, pErrors, output]);
        throw new Error("Could not inflate, error_code: " + errors);
    }
    extractSize = Module.getValue(pOutputSize, 'i32');

    if(isImage){
        //Make 3 integers for image data (DxtType, width, height)
        var pDxtType = Module._malloc(2);
        var pImgW = Module._malloc(2);
        var pImgH = Module._malloc(2);

        //workImage(uint32_t inputSize, const uint8_t* pInputBuffer, 
        //uint32_t& orOutputSize, int& oDxtType, int& oImgW, int& oImgH, uint8_t& pErrors)
        var image_output = Module.ccall('workImage', 'i8*', ['i32', 'i8*', 'i32*', 'i32*', 'i16*', 'i16*', 'i16*', 'i8*'],
        [extractSize, output, pOutputSize, pDxtType, pImgW, pImgH, pErrors]);

        //Check for errors
        var errors = Module.getValue(pErrors, 'i8');
        if(errors != 0){
            cleanup([input, pOutputSize, pErrors, output, pDxtType, pImgW, pImgH, image_output]);
            throw new Error("Could not inflate, error_code: " + errors);
        }

        //Free up the output buffer since it's not used anymore and make the image buffer the new output buffer
        cleanup([output]);
        output = image_output;

        //Get the data from the pointers
        extractSize = Module.getValue(pOutputSize, 'i32');
        inflate_value['dxtType'] = Module.getValue(pDxtType, 'i16');
        inflate_value['imgW'] = Module.getValue(pImgW, 'i16');
        inflate_value['imgH'] = Module.getValue(pImgH, 'i16');

        cleanup([pDxtType, pImgW, pImgH]);
    }

    var outputBuffer = new Uint8Array(extractSize);
    for(var i=0; i<extractSize; i++){
        outputBuffer[i] = Module.getValue(output + i, 'i8');
    }

    inflate_value['data'] = outputBuffer;

    //Cleaning memory
    cleanup([input, output, pOutputSize, pErrors]);

    return inflate_value;
}

/**
 * This function was here mostly to check that the decoding was working fine.
 * But if a file have been already inflated it can read the image.
 * @method inflateImage
 * @param  {ArrayBuffer} inputBuffer Buffer containing the input data
 * @return {Object} Object containing an output buffer, and image infos
 * 
 * The return object have the following fields:
 * - {ArrayBuffer}  object.data
 * - {number}       object.dxtType
 * - {number}       object.imgW     width
 * - {number}       object.imgH     height
 */
function inflateImage(inputBuffer) {
    var inflate_value = {};
    var input = Module._malloc(inputBuffer.length);
    Module.writeArrayToMemory(inputBuffer, input);

    //Make 3 integers for image data (DxtType, width, height)
    var pDxtType = Module._malloc(2);
    var pImgW = Module._malloc(2);
    var pImgH = Module._malloc(2);
    var pOutputSize = Module._malloc(4);
    var pErrors = Module._malloc(1);

    //workImage(uint32_t inputSize, const uint8_t* pInputBuffer, 
    //uint32_t& orOutputSize, int& oDxtType, int& oImgW, int& oImgH, uint8_t& pErrors)
    var output = Module.ccall('workImage', 'i8*', ['i32', 'i8*', 'i32*', 'i32*', 'i16*', 'i16*', 'i16*', 'i8*'],
    [inputBuffer.length, input, pOutputSize, pDxtType, pImgW, pImgH, pErrors]);

    //Check for errors
    var errors = Module.getValue(pErrors, 'i8');
    if(errors != 0){
        cleanup([input, pDxtType, pImgW, pImgH, pOutputSize, pErrors, output]);
        throw new Error("Could not inflate, error_code: " + errors);
    }

    //Get the data from the pointers
    extractSize = Module.getValue(pOutputSize, 'i32');
    inflate_value['dxtType'] = Module.getValue(pDxtType, 'i16');
    inflate_value['imgW'] = Module.getValue(pImgW, 'i16');
    inflate_value['imgH'] = Module.getValue(pImgH, 'i16');

    var outputBuffer = new Uint8Array(extractSize);
    for(var i=0; i<extractSize; i++){
        outputBuffer[i] = Module.getValue(output + i, 'i8');
    }

    inflate_value['data'] = outputBuffer;
    cleanup([input, pDxtType, pImgW, pImgH, pOutputSize, pErrors, output]); 
    return inflate_value;
}

function cleanup(array) {
    for (let elt of array) {
        Module._free(elt);
    }
}

Module['inflate'] = inflate;
Module['inflateImage'] = inflateImage;