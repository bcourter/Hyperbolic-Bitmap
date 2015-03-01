
var p = 7;
var q = 3;
var maxIterations = 16;

var width = 256;
var height = width;

var region = new Region(p, q);
var circleInversion = region.c.asMobius();
update();

function update() {
	var image = document.getElementById("sourceImage");
	var sourceC = document.getElementById("sourceCanvas");
	var sourceCtx = sourceC.getContext("2d");
	sourceC.width = image.width;
	sourceC.height = image.height;

	console.log("drawing image...");
	sourceCtx.drawImage(image, 0, 0, image.width, image.height);

	var destC = document.getElementById("destCanvas");
	var destCtx = destC.getContext("2d");
	// destCtx.fillStyle = "#FF0000";
	// destCtx.fillRect(0,0,150,75);
	destC.width = width;
	destC.height = height;

	console.log("sampling...");

	for (var j = 0; j < height; j++) {
		console.log("row" +j + "/" + height);
		for (var i = 0; i < width; i++) { //setInterval(function() {
			var z = new Complex(i/width, j/height);
			z = reversePixelLookup(z);

			var data;
			if (z == null) {
				data = [0, 0, 0, 0];
			}
			else {
				var p = z.scale(image.height);
				var p00 = new Complex(
					Math.min(Math.floor(p.re), image.width-1),
					Math.min(Math.floor(p.im), image.height-1)
				);

				var p10 = new Complex(p00.re+1, p00.im);
				var p01 = new Complex(p00.re, p00.im+1);
				var p11 = new Complex(p00.re+1, p00.im+1);

				var data00 = readData(p00);
				var data10 = readData(p10);
				var data01 = readData(p01);
				var data11 = readData(p11);

				data = [
			 		bilinear(p.re, p.im, p00.re, p00.im, p11.re, p11.im, data00[0], data10[0], data01[0], data11[0]),
			 		bilinear(p.re, p.im, p00.re, p00.im, p11.re, p11.im, data00[1], data10[1], data01[1], data11[1]),
			 		bilinear(p.re, p.im, p00.re, p00.im, p11.re, p11.im, data00[2], data10[2], data01[2], data11[2]),
			 		bilinear(p.re, p.im, p00.re, p00.im, p11.re, p11.im, data00[3], data10[3], data01[3], data11[3])
				];
			}

			drawData(destCtx, i, j, data);
		}  //, 1000/5); }
	}

	console.log("done");

	function readData(p){
		return sourceCtx.getImageData(p.re, p.im, 1, 1).data;
	}

}



function bilinear(x, y, x1, y1, x2, y2, d11, d21, d12, d22) {
	//var denom = (x2-x1) * (y2-y1);
	return Math.floor(
			d11 * (x2-x) * (y2-y) +
			d21 * (x-x1) * (y2-y) +
			d12 * (x2-x) * (y-y1) +
			d22 * (x-x1) * (y-y1)
		);

}

function reversePixelLookup(z) {
	if (z.modulusSquared() >= 1.0){
		return null;
	}

	for (var i=0; i<maxIterations; i++) {
		// rotate into region [-PI/p, PI/p]
		z = rotateInto(z);
		if (inFundamentalRegion(z)) {
			return z;
		}

		// reflect over line y=0
		z.im = -z.im;
		if (inFundamentalRegion(z)) {
			return z;
		}

		// reflect over circle C
		z = z.transform(circleInversion);
		if (inFundamentalRegion(z)) {
			return z;
		}
	}

	return null;
}

function rotateInto(z) {
	var upper = Math.PI / p;
	var lower = -Math.PI / p;
	var rot = Complex.createPolar(1, 2 * Math.PI / p);
	while (z.argument() >= upper || z.argument() < lower) {
		z = Complex.multiply(z, rot);
	}

	return z;
}

function invert(z) {
	z.transform(circleInversion);
	return z;
}

function inFundamentalRegion(z){
	if (z.im < 0) {
		return false;
	}

	if (z.argument() > Math.PI / p) {
		return false;
	}

	var dist = new Complex(z.re - region.d, z.im).modulus();
	if (dist < region.r) {
		return false;
	}

	return true;
}


function drawData(ctx, i, j, data){
	ctx.fillStyle = "rgb(" + data[0] + ", " + data[1] + ", " + data[2] + ")";
	ctx.fillRect(i, j, 1, 1);
}