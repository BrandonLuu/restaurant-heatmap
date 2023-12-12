$(function () {
    $("button").on("click", function () {
        // $.getJSON(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=cruise&location=-33.8670522%2C151.1957362&radius=1500&type=restaurant&key=AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs`,
        $.getJSON(`https://absolute-realm-165220.wl.r.appspot.com/search/location=-33.8670522%2C151.1957362&radius=15002&type=restaurant&key=AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs`,
        // $.getJSON(`http://localhost:8081/search/location=-33.8670522%2C151.1957362&radius=15002&type=restaurant&key=AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs`,
         function (result) {
            $.each(result, function (i, field) {
                $("div").append(field + " ");
            });
        });
    });
});