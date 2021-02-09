module.exports = function (api) {

    let presets = [
        "@babel/preset-env"
    ]

    if (api.env("production")) {
        presets.push(['minify', { builtIns: false }])
    }

    api.cache(false);

    return {
        "presets": presets
    }
}