
var p = 5;
var q = 4;
var maxIterations = 16;

var targetLowerLeft = new Complex (0, 0);
var targetUpperRight = new Complex (3.5, 3.2);
// var targetLowerLeft = new Complex (-1, -1);
// var targetUpperRight = new Complex (1, 1);
var targetSpan = Complex.subtract(targetUpperRight, targetLowerLeft);

var width = 1024;
var height = Math.floor(width / targetSpan.re * targetSpan.im);

var region = new Region(p, q);
var circleInversion = region.c.asMobius();

var toHalfPlane = new Mobius(Complex.i, Complex.i, Complex.one, Complex.one.negative());
var fromHalfPlane = new Mobius(Complex.one, Complex.i.negative(), Complex.one, Complex.i);
var automorphism = Mobius.createDiscAutomorphism(new Complex(0.2, 0.3), 0);

var rotation = Mobius.createRotation(3/10 * Math.PI)
var translation = Mobius.createDiscAutomorphism(new Complex(-region.p1.modulus(), 0), 3/10 * Math.PI);
var initialTrans = Mobius.multiply(translation, rotation).inverse();

var analyticTrans = Mobius.multiply(translation, fromHalfPlane);
//var analyticTrans = rotation;
//analyticTrans = analyticTrans.inverse();

update();

function update() {
	var image = document.getElementById("sourceImage");
	var sourceC = document.getElementById("sourceCanvas");
	var sourceCtx = sourceC.getContext("2d");
	sourceC.width = image.width;
	sourceC.height = image.height;

	console.log("drawing image...");
	sourceCtx.drawImage(image, 0, 0, image.width, image.height);

	var scale = Mobius.createScale(image.height * 3);
	var translation = Mobius.createTranslation(new Complex(10, 10));
	var fundamentalTrans = Mobius.multiply(translation, scale);
//	var fundamentalTrans = scale

	var p0t = region.p0.transform(fundamentalTrans);
	var p1t = region.p1.transform(fundamentalTrans);
	var p2t = region.p2.transform(fundamentalTrans);

	sourceCtx.strokeStyle = "#00AA33";
	sourceCtx.beginPath();
	sourceCtx.moveTo(p0t.re, p0t.im);
	sourceCtx.lineTo(p1t.re, p1t.im);
	
	var arcCount = 6;
	for (var i = 1; i < arcCount; i++) {
		var p = Complex.subtract(p1t, Complex.createPolar(region.r, Math.PI * (1 - 1/p)));
		sourceCtx.lineTo(p.re, p.im);
	}

	sourceCtx.lineTo(p2t.re, p2t.im);
	sourceCtx.lineTo(p0t.re, p0t.im);
	sourceCtx.stroke();

	var destC = document.getElementById("destCanvas");
	var destCtx = destC.getContext("2d");
	
	destC.width = width;
	destC.height = height;

	console.log("sampling...");

	var start = new Date();
	for (var j = 0; j < height; j++) {
		var elapsed = new Date() - start;
		var estimate = elapsed / i * (height-1)
		console.log("row " + j + "/" + (height-1) + "  remain: " + estimate / 1000);
		for (var i = 0; i < width; i++) { //setInterval(function() {
			var z = new Complex(targetLowerLeft.re + i / width * targetSpan.re, targetLowerLeft.im + j / height * targetSpan.im);
			z = Complex.cosh(z);
			z = z.transform(analyticTrans);
			z = z.clean();
			z = reversePixelLookup(z);

			var data;
			if (z == null) {
				data = [0, 0, 0, 0];
			}
			else {
				var p = z.transform(fundamentalTrans);
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
	while (z.argument() > upper || z.argument() < lower) {
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