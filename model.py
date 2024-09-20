import os
import glob
import shutil
import time

import tensorflow as tf
from tensorflow import keras
import keras_cv
from keras_cv import bounding_box
from keras_cv import visualization
import numpy as np
from PIL import Image
from functools import partial
import matplotlib
matplotlib.use('Agg')



from constants import (
    IMAGE_SIZE,
    MAX_NO_REC_IMAGES,
    class_mapping,
    name_to_id,
    class_mapping_drawing
)
from utilsIR import (
    load_pretrained_weights,
    load_img_as_tensor
)



# Allow conversion from Tensor to Numpy Array
tf.config.run_functions_eagerly(True)
tf.data.experimental.enable_debug_mode()

class YOLO():

    def __init__(self, weights_path):
        self._model = load_pretrained_weights(weights_path)

    def predict(self, image_path):
        img_tensor = load_img_as_tensor(image_path)
        y_pred = self._model.predict(img_tensor)


        


        y_pred_labels = y_pred['classes'][y_pred['classes'] > -1]
        

        if len(y_pred_labels) == 0:
            return 'NA'

        y_pred_confidences = y_pred['confidence'][y_pred['confidence'] > -1]

        confidence_dict = dict(zip(y_pred_labels, y_pred_confidences))


        # Get the highest confidence recognized label that is not BullsEye
        for label_idx in y_pred_labels:
            # If the label is not BullEyes and the label confidence is > 0.8
            max_confidence = float('-inf')
            if label_idx != 12 and confidence_dict[label_idx] > 0.5 and confidence_dict[label_idx] > max_confidence:
                max_confidence = confidence_dict[label_idx]
                label = class_mapping[label_idx]


        rand = str(int(time.time()))
        cur_dir = os.getcwd()
        if not os.path.exists(os.path.join(cur_dir, "own_results")):
            os.makedirs(os.path.join(cur_dir, "own_results"))

        predict_path = os.path.join(
            cur_dir,
            f"own_results/annotated_image_{label}_{rand}.jpg",
        )


        visualization.plot_bounding_box_gallery(
            img_tensor,
            value_range = (0, 255),
            y_pred = y_pred,
            scale = 100,
            rows = 1,
            cols = 1,
            show = False,
            font_scale = 0.5,
            class_mapping = class_mapping_drawing,
            bounding_box_format = "xyxy",
            path = predict_path
        )

        return name_to_id[label]



    
def stitch_image():
    """
    Stitches the images in the folder together and saves it into runs/stitched folder
    """
    # Initialize path to save stitched image
    imgFolder = 'runs'
    stitchedPath = os.path.join(imgFolder, f'stitched-{int(time.time())}.jpeg')

    # Find all files that ends with ".jpg" (this won't match the stitched images as we name them ".jpeg")
    imgPaths = glob.glob(os.path.join(imgFolder+"/detect/*/", "*.jpg"))
    # Open all images
    images = [Image.open(x) for x in imgPaths]
    # Get the width and height of each image
    width, height = zip(*(i.size for i in images))
    # Calculate the total width and max height of the stitched image, as we are stitching horizontally
    total_width = sum(width)
    max_height = max(height)
    stitchedImg = Image.new('RGB', (total_width, max_height))
    x_offset = 0

    # Stitch the images together
    for im in images:
        stitchedImg.paste(im, (x_offset, 0))
        x_offset += im.size[0]
    # Save the stitched image to the path
    stitchedImg.save(stitchedPath)

    # Move original images to "originals" subdirectory
    for img in imgPaths:
        shutil.move(img, os.path.join(
            "runs", "originals", os.path.basename(img)))

    return stitchedImg

def stitch_image_own():
    """
    Stitches the images in the folder together and saves it into own_results folder

    Basically similar to stitch_image() but with different folder names and slightly different drawing of bounding boxes and text
    """
    imgFolder = 'own_results'
    stitchedPath = os.path.join(imgFolder, f'stitched-{int(time.time())}.jpeg')

    imgPaths = glob.glob(os.path.join(imgFolder+"/annotated_image_*.jpg"))
    imgTimestamps = [imgPath.split("_")[-1][:-4] for imgPath in imgPaths]
    
    sortedByTimeStampImages = sorted(zip(imgPaths, imgTimestamps), key=lambda x: x[1])

    images = [Image.open(x[0]) for x in sortedByTimeStampImages]
    width, height = zip(*(i.size for i in images))
    total_width = sum(width)
    max_height = max(height)
    stitchedImg = Image.new('RGB', (total_width, max_height))
    x_offset = 0

    for im in images:
        stitchedImg.paste(im, (x_offset, 0))
        x_offset += im.size[0]
    stitchedImg.save(stitchedPath)

    return stitchedImg





