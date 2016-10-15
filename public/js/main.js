function previewProposal(){
	document.getElementById("preview-zone").innerHTML = "<h3>Problem</h3>" + document.getElementById("prob-stmt").value + "<h3>Answer</h3>" + document.getElementById("prob-ans").value + "<h3>Solution</h3>" + document.getElementById("prob-soln").value;
	MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

function previewAlternate(){
	document.getElementById("preview-alternate").innerHTML = document.getElementById("alternate").value;
	MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

function previewComment(){
	document.getElementById("preview-comment").innerHTML = document.getElementById("comment").value;
	MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}