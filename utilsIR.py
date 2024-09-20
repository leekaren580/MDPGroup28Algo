import tensorflow as tf
import keras_cv
from keras_cv import bounding_box
from keras_cv import visualization

from constants import (
    IMAGE_SIZE,
    class_mapping
)

tf.config.run_functions_eagerly(True)
tf.data.experimental.enable_debug_mode()



def load_pretrained_weights(weights_path):

    backbone = keras_cv.models.YOLOV8Backbone.from_preset(
        "yolo_v8_s_backbone"  
    )

    yolo = keras_cv.models.YOLOV8Detector(
    num_classes = len(class_mapping),
    bounding_box_format = "xyxy",
    backbone = backbone,
    fpn_depth = 1,
    )

    yolo.load_weights(weights_path)

    return yolo

def load_img_as_tensor(img_path):
    # Read the image from the file
    image = tf.io.read_file(img_path)

    # Decode the image, TensorFlow supports multiple formats like JPEG, PNG, etc.
    image = tf.image.decode_image(image, channels=3)

    # Optionally, convert to float32 and normalize the pixel values to [0, 1]
    image = tf.image.convert_image_dtype([image], tf.float32)

    # Optionally, resize the image to the desired shape
    image = tf.image.resize(image, [640, 640])  # Resize to 224x224 for example (common size for CNN models)

    # Return the image as a tensor
    return image * 255


def decode_image(image):

    # Decode the given jpeg image file into a tf tensor
    image = tf.image.decode_jpeg(image, channels = 3)
    image = tf.cast(image, tf.float32)
    image = tf.reshape(image, [*IMAGE_SIZE, 3])

    return image


