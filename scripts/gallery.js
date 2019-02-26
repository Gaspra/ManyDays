var googleBucket = "https://storage.googleapis.com/manydays-gallery/";
var thumbnailBucket = googleBucket + "thumbnail/";
var previewBucket = googleBucket + "preview/";
var rawBucket = googleBucket + "raw/";
var imagePrefix = ".png";
var galleryPromiseBatchSize = 10;
var lastLoadedThumbnail;
var loadThumbnails = false;

function InitialiseGallery()
{
    ManyDaysGallery.Promises = [];
    lastLoadedThumbnail = ImageCollection.ImageCount - 1;

    for(var i = ImageCollection.ImageCount - 1; i--; i > -1)
    {
        $('#gallery').append('<div class="imgThumbnail imgHidden" id="img_'+ImageCollection.Json["Images"][i].Id+'"></div>');
    }

    navPause.on('click', function()
    {
        ToggleThumbnailsLoading();
    });

    ResizeThumbnails();
}

function RecurseLoadThumbnails()
{
    if(loadThumbnails)
    {
        LoadThumbnailsBatch().then(function() {
            RecurseLoadThumbnails();
        });
    }

    if(lastLoadedThumbnail = 0)
    {
        SetStatus('Loading completed', 5);
        navPause.css("display", "none");
    }
}

function ToggleThumbnailsLoading()
{
    loadThumbnails = !loadThumbnails;

    if(loadThumbnails)
    {
        navPause.text("Loading");
    } else
    {
        navPause.text("Paused");
    }

    if(loadThumbnails && lastLoadedThumbnail > -1)
    {
        RecurseLoadThumbnails();
    }
}

function LoadThumbnailsBatch()
{
    return new Promise(function(resolve, reject)
    {
        var endOfBatch = lastLoadedThumbnail - galleryPromiseBatchSize;

        if(endOfBatch < -1)
        {
            endOfBatch = 0;
        }

        for(var i = lastLoadedThumbnail; i--; i > endOfBatch)
        {
            ManyDaysGallery.Promises.push(InitialiseImage(ImageCollection.Json["Images"][i]));
        }

        Promise.all(ManyDaysGallery.Promises).then(function()
        {
            ManyDaysGallery.Promises = [];
            SetStatus("Loaded batch: " + lastLoadedThumbnail + " to " + endOfBatch, 0);
            lastLoadedThumbnail = endOfBatch;
            resolve();
        });
    });
}

function InitialiseImage(image)
{
    return new Promise(function(resolve, reject)
    {
        $('<img/>').attr('src', thumbnailBucket + image.Filename + imagePrefix)
            .on('load', function ()
            {
                $('#img_'+image.Id).css('background-image', 'url('+ thumbnailBucket + image.Filename + imagePrefix +')');
                $('#img_'+image.Id).removeClass('imgHidden');
                AddMapMarker(image);
                CreateClickEvent(image);
                console.log('loaded image, about to resolve: ' + image.Id + ' ' + image.Filename);
                resolve();
            })
            .on('error', function (err)
            {
                console.log('Failed to get image, error: ' + err);
                resolve(); //lol
            });
    });
}

function CreateClickEvent(image)
{
    $('#img_'+image.Id).on('click', function()
    {
        PreviewImage(image);
    });
}

function PreviewImage(image)
{
    SetStatus("Loading "+image.Name, 0)
    var loadPreviewPromise = LoadPreview(image);
    loadPreviewPromise.then(function() {
        SetStatus("", 0)
        previewTitle.text(image.Name + ": " + image.Id);
        previewContainer.css("display", "block");
        previewImage.off();
        previewImage.on('click',function() {
            window.open(rawBucket + image.Filename + imagePrefix, '_blank');
        });
    });
}

function LoadPreview(image)
{
    return new Promise((resolve, reject) => {
        $('<img/>').attr('src', previewBucket + image.Filename + imagePrefix)
        .on('load', function ()
        {
            previewImage.css('background-image', 'url('+ previewBucket + image.Filename + imagePrefix +')');
            resolve();
        })
        .on('error', function (err)
        {
            console.log('Failed to get image, error: ' + err);
            resolve();
        });
    });
}
