
update();

function update() {
	var image = document.getElementById("sourceImage");
	var sourceC = document.getElementById("sourceCanvas");
	var sourceCtx = sourceC.getContext("2d");
	sourceC.width = image.width;
	sourceC.height = image.height;

	console.log("drawing image...");
	sourceCtx.drawImage(image, 0, 0, image.width, image.height);

	var p = 7;
	var q = 3;
	var maxIterations = 16;

	var width = 256;
	var height = 256;
	var destC = document.getElementById("destCanvas");
	var destCtx = destC.getContext("2d");
	// destCtx.fillStyle = "#FF0000";
	// destCtx.fillRect(0,0,150,75);
	destC.width = width;
	destC.height = height;

	console.log("sampling...");

	for (var i = 0; i < width; i++) {
		for (var j = 0; j < height; j++) {
			var z = new Complex(i/width, j/height);
			//x = reversePixelLookup(z);

			var data = sourceCtx.getImageData(i, j, 1, 1).data;


			drawData(destCtx, i, j, data);
		}
	}

	console.log("done");

}

function drawData(ctx, i, j, data){
	ctx.fillStyle = "rgb(" + data[0] + ", " + data[1] + ", " + data[2] + ")";
	ctx.fillRect(i, j, 1, 1);
}

function reversePixelLookup(z) {
	for (var i=0; i<maxIterations; i++) {
		// rotate into region [-PI/p, PI/p]
		z = rotateInto(z, -Math.PI/p, Math.PI/p);
		if (inFundamentalRegion(z)) 
			return z;

		// reflect over line y=0
		z.im = -z.im;
		if (inFundamentalRegion(z)) 
			return z;

		// reflect over circle C
		z = invert(z, C);
		if (inFundamentalRegion(z)) 
			return z;
	}

	return null;
}

function rotateInto(z, upper, lower) {
	var rot = Complex.createPolar(1, 2 * Math.PI / p);
	var a;
	while ((a = z.argument()) > upper || a < lower) {
		z = Complex.multiply(z, rot);
	}

	return z;
}