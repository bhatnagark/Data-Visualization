$(document).ready(function() {
  $('.rt-select').material_select();

  //===============================================
  function select2DataCollectName(d) {
    if (d.children)
      d.children.forEach(select2DataCollectName);
    else if (d._children)
      d._children.forEach(select2DataCollectName);
    select2Data.push(d.name);
  }

  var tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
      .style("width","150px")
      .style("height","160px")
      .style("padding","3px")
      .style("font","16px courier")
      .style("border","0px")
      .style("border-radius","8px")
      .style("background", "grey")
  .style("visibility", "hidden");
  //===============================================
  function searchTree(d) {
    if (d.children)
      d.children.forEach(searchTree);
    else if (d._children)
      d._children.forEach(searchTree);
    var searchFieldValue = eval(searchField);
    if (searchFieldValue && searchFieldValue.match(searchText)) {
      // Walk parent chain
      var ancestors = [];
      var parent = d;
      while (typeof(parent) !== "undefined") {
        ancestors.push(parent);
        //console.log(parent);
        parent.class = "found";
        parent = parent.parent;
      }
      //console.log(ancestors);
    }
  }

  //===============================================
  function clearAll(d) {
    d.class = "";
    if (d.children)
      d.children.forEach(clearAll);
    else if (d._children)
      d._children.forEach(clearAll);
  }

  //===============================================
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  //===============================================
  function collapseAllNotFound(d) {
    if (d.children) {
      if (d.class !== "found") {
        d._children = d.children;
        d._children.forEach(collapseAllNotFound);
        d.children = null;
      } else
        d.children.forEach(collapseAllNotFound);
    }
  }

  //===============================================
  function expandAll(d) {
    if (d._children) {
      d.children = d._children;
      d.children.forEach(expandAll);
      d._children = null;
    } else if (d.children)
      d.children.forEach(expandAll);
  }



  //===============================================
  // Toggle children on click.
  function toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    clearAll(root);
    update(d);
    $("#searchName").select2("val", "");
  }

  //===============================================
  $("#searchName").on("select2-selecting", function(e) {
    clearAll(root);
    expandAll(root);
    update(root);

    searchField = "d.name";
    searchText = e.object.text;
    searchTree(root);
    root.children.forEach(collapseAllNotFound);
    update(root);
  })

  //===============================================
  var margin = {
      top: 120,
      right: 10,
      bottom:20,
      left: 60
    },
    width = 660 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

  var i = 0,
    duration = 750,
    root;

  var tree = d3.layout.tree()
    .size([height, width]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  var svg = d3.select("#tree_chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.json("flare.json", function(error, data) {

    var myData = data;
    root = myData;
    root.x0 = height / 2;
    root.y0 = 0;

    select2Data = [];
    select2DataCollectName(root);
    select2DataObject = [];
    select2Data.sort(function(a, b) {
        if (a > b) return 1; // sort
        if (a < b) return -1;
        return 0;
      })
      .filter(function(item, i, ar) {
        return ar.indexOf(item) === i;
      }) // remove duplicate items
      .filter(function(item, i, ar) {
        select2DataObject.push({
          "id": i,
          "text": item
        });
      });
    select2Data.sort(function(a, b) {
        if (a > b) return 1; // sort
        if (a < b) return -1;
        return 0;
      })
      .filter(function(item, i, ar) {
        return ar.indexOf(item) === i;
      }) // remove duplicate items
      .filter(function(item, i, ar) {
        select2DataObject.push({
          "id": i,
          "text": item
        });
      });
    $("#searchName").select2({
      data: select2DataObject,
      containerCssClass: "search",
      placeholder: "Search for culture, alligiance or character.."
    });

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    root.children.forEach(collapse);
    update(root);
  });

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * 180;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
      .data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", toggle);

    // Append Images
    nodeEnter.append("svg:image")
      .attr("xlink:href", function(d) {
        return d.icon;
      })
      .attr("x", function(d) {
        return -15;
      })
      .attr("y", function(d) {
        return -12;
      })
      .attr("height", 25)
      .attr("width", 25);

    nodeEnter.append("text")
      .attr("x", function(d) {
        return d.children || d._children ? -10 : 10;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
        return d.name;
      })
      .style("fill-opacity", 1e-6)
      .on("mouseover", function(d){
            tooltip.text(d.name);

            tooltip.append("img")
                    .attr("src", d.icon)
                    .attr("x", -8)
                    .attr("y", -8)
                    .attr("width","140px")
                    .attr("height","110px");

            tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(){return tooltip.style("top", (event.pageY-
                                      10)+"px").style("left",(event.pageX+10)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style("fill", function(d) {
        if (d.class === "found") {
          return "#4cff00"; //lime-green
        } else if (d._children) {
          return "orange";
        } else {
          return "#E91E63";
        }
      })
      .style("stroke", function(d) {
        if (d.class === "found") {
          return "#4cff00"; //lime-green
        } else {
          return "rgba(255, 255, 255, 0.03)"
        }
      })
      .style("stroke-width", function(d) {
        if (d.class === "found") {
          return "1px"; //lime-green
        } else {
          return "1px"
        }
      });

    nodeUpdate.select("text")
      .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select("circle")
      .attr("r", 1e-6);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
      .data(links, function(d) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .style("stroke", "#ffffff") // Handle the appending of level color from data to link.
      .attr("d", function(d) {
        var o = {
          x: source.x0,
          y: source.y0
        };
        return diagonal({
          source: o,
          target: o
        });
      });

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal)
      .style("stroke", function(d) {
        if (d.target.class === "found") {
          return "#4cff00";
        }
      })
      .style("stroke-opacity", function(d) {
        if (d.target.class === "found") {
          return 0.27;
        }
      })
      .style("stroke-width", function(d) {
        if (d.target.class === "found") {
          return ".25rem";
        }
      })
      .style("fill-opacity", function(d) {
        if (d.target.class === "found") {
          return 0.57;
        }
      });

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {
          x: source.x,
          y: source.y
        };
        return diagonal({
          source: o,
          target: o
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

  };



    var expandLegend = function() {
    var exp = chart.legend.expanded();
    chart.legend.expanded(!exp);
    chart.update();
  }


  var colors = d3.scale.category20();
  var legend = nv.models.legend().width(400)


});
