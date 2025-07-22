"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, DollarSign, Clock, CheckCircle } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";

export default function CreateGig() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subcategory: "",
    description: "",
    tags: [],
    images: [], // Array of { localUrl, file } for preview
    uploadedImages: [], // Array of Cloudinary URLs after upload
    packages: {
      basic: { name: "Basic", price: "", delivery: "1", features: [""] },
      standard: { name: "Standard", price: "", delivery: "3", features: [""] },
      premium: { name: "Premium", price: "", delivery: "7", features: [""] },
    },
    requirements: "",
    faqs: [],
  });
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Categories and subcategories
  const categories = [
    { id: "graphics", name: "Graphics & Design", subcategories: ["Logo Design", "Brand Identity", "Business Cards", "Social Media Graphics"] },
    { id: "digital-marketing", name: "Digital Marketing", subcategories: ["SEO", "Social Media Marketing", "Content Marketing", "Email Marketing"] },
    { id: "writing", name: "Writing & Translation", subcategories: ["Content Writing", "Copywriting", "Technical Writing", "Translation"] },
    { id: "video", name: "Video & Animation", subcategories: ["Video Editing", "Animation", "Motion Graphics", "Video Production"] },
    { id: "programming", name: "Programming & Tech", subcategories: ["Web Development", "Mobile Apps", "Game Development", "Data Science"] },
    { id: "business", name: "Business", subcategories: ["Business Plans", "Market Research", "Presentations", "Virtual Assistant"] },
  ];

  // Get user from JWT token
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = token ? jwt.decode(token) : null;

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Handle package changes
  const handlePackageChange = (packageType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageType]: {
          ...prev.packages[packageType],
          [field]: value,
        },
      },
    }));
    setValidationErrors((prev) => ({ ...prev, [`${packageType}.price`]: "" }));
  };

  // Add package feature
  const addPackageFeature = (packageType) => {
    const currentFeatures = formData.packages[packageType].features;
    handlePackageChange(packageType, "features", [...currentFeatures, ""]);
  };

  // Remove package feature
  const removePackageFeature = (packageType, index) => {
    const currentFeatures = formData.packages[packageType].features;
    const newFeatures = currentFeatures.filter((_, i) => i !== index);
    handlePackageChange(packageType, "features", newFeatures);
  };

  // Update package feature
  const updatePackageFeature = (packageType, index, value) => {
    const currentFeatures = formData.packages[packageType].features;
    const newFeatures = [...currentFeatures];
    newFeatures[index] = value;
    handlePackageChange(packageType, "features", newFeatures);
  };

  // Add tag
  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      handleInputChange("tags", [...formData.tags, tag]);
    }
  };

  // Remove tag
  const removeTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    handleInputChange("tags", newTags);
  };

  // Handle image selection for preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      setError("Maximum 5 images allowed");
      console.error("Image selection error: Maximum 5 images allowed", { currentImages: formData.images.length, newFiles: files.length });
      return;
    }
    setError("");
    const newImages = files.map((file) => ({
      localUrl: URL.createObjectURL(file),
      file,
    }));
    console.log("Images selected for preview:", newImages.map((img) => ({ name: img.file.name, size: img.file.size, type: img.file.type })));
    handleInputChange("images", [...formData.images, ...newImages]);
  };

  // Remove image from preview
  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    console.log("Image removed from preview:", { index, removedImage: formData.images[index] });
    handleInputChange("images", newImages);
  };

  // Handle image uploads to Cloudinary
  const handleImageUpload = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    const uploadedUrls = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        console.log("Uploading image:", { name: file.name, size: file.size, type: file.type });

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(Math.round((completedFiles + progress / 100) / totalFiles * 100));
          }
        };

        const response = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(formData);
        });

        const data = response;
        if (data.url) {
          console.log("Image uploaded successfully:", { url: data.url });
          uploadedUrls.push(data.url);
        } else {
          console.error("Upload API error:", { status: xhr.status, error: data.error });
          throw new Error(data.error || "Image upload failed");
        }
      } catch (err) {
        console.error("Client-side upload error:", {
          message: err.message,
          name: err.name,
          file: { name: file.name, size: file.size, type: file.type },
        });
        setError(err.message || "Failed to upload one or more images");
        setUploading(false);
        return [];
      }
      completedFiles++;
      setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
    }
    setUploading(false);
    setUploadProgress(100);
    handleInputChange("uploadedImages", uploadedUrls);
    return uploadedUrls;
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.subcategory) errors.subcategory = "Subcategory is required";
    if (!formData.description) errors.description = "Description is required";
    for (const [key, pkg] of Object.entries(formData.packages)) {
      if (!pkg.price || isNaN(pkg.price) || Number(pkg.price) < 5) {
        errors[`${key}.price`] = `Price for ${key} package must be at least ₹5`;
      }
      if (pkg.features.some((f) => !f)) {
        errors[`${key}.features`] = `All features in ${key} package must be filled`;
      }
    }
    setValidationErrors(errors);
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      console.error("Validation errors:", errors);
      return errorMessages[0];
    }
    return "";
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in");
      console.error("Submission error: No user authenticated");
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Upload images to Cloudinary
      let imageUrls = [];
      const files = formData.images.map((img) => img.file).filter(Boolean);
      if (files.length > 0) {
        console.log("Starting image uploads:", { fileCount: files.length });
        const uploaded = await handleImageUpload(files);
        if (uploaded.length === 0 && files.length > 0) {
          console.error("No images uploaded successfully");
          return;
        }
        imageUrls = uploaded;
      }

      // Transform packages object to array
      const packagesArray = Object.values(formData.packages).map((pkg) => ({
        name: pkg.name,
        price: pkg.price.toString(), // Ensure string type
        delivery: pkg.delivery,
        features: pkg.features,
      }));

      // Post to API
      console.log("Submitting gig data:", {
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        imageCount: imageUrls.length,
        userId: user.id,
        packages: packagesArray,
      });
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          tags: formData.tags,
          images: imageUrls,
          packages: packagesArray, // Send as array
          requirements: formData.requirements,
          faqs: formData.faqs,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Gig creation error:", { status: res.status, message: data.message });
        throw new Error(data.message || "Failed to create gig");
      }

      console.log("Gig created successfully:", { gigId: data.gig._id });
      formData.images.forEach((img) => URL.revokeObjectURL(img.localUrl));
      router.push("/gigs");
    } catch (err) {
      console.error("Submission error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Something went wrong");
    }
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep === 2) {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Gig</h1>
          <p className="text-gray-600">Tell us what service you offer and start earning</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  step <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gig Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="I will create a modern logo design for your business"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      validationErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    maxLength={80}
                  />
                  {validationErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{formData.title.length}/80 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.category ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory *
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange("subcategory", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.subcategory ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      disabled={!formData.category}
                    >
                      <option value="">Select a subcategory</option>
                      {formData.category &&
                        categories
                          .find((cat) => cat.id === formData.category)
                          ?.subcategories.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                    </select>
                    {validationErrors.subcategory && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.subcategory}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={6}
                    placeholder="Describe your service in detail..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      validationErrors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    maxLength={1200}
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{formData.description.length}/1200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Tags (Max 5)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Packages */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Pricing & Packages</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(formData.packages).map(([key, pkg]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 capitalize">{key}</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (INR) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => handlePackageChange(key, "price", e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              validationErrors[`${key}.price`] ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                            min="5"
                            placeholder="Enter price (min ₹5)"
                          />
                        </div>
                        {validationErrors[`${key}.price`] && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors[`${key}.price`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Time (days) *
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <select
                            value={pkg.delivery}
                            onChange={(e) => handlePackageChange(key, "delivery", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          >
                            <option value="1">1 day</option>
                            <option value="2">2 days</option>
                            <option value="3">3 days</option>
                            <option value="5">5 days</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Features *
                        </label>
                        <div className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => updatePackageFeature(key, index, e.target.value)}
                                placeholder="e.g., Logo concepts included"
                                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                  validationErrors[`${key}.features`] ? "border-red-500" : "border-gray-300"
                                }`}
                                required
                              />
                              {pkg.features.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePackageFeature(key, index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {validationErrors[`${key}.features`] && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors[`${key}.features`]}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => addPackageFeature(key)}
                            className="flex items-center text-green-600 hover:text-green-700 text-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Feature
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Gallery */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Gallery</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images (Max 5)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-1">Supported formats: JPG, PNG, GIF (Max 5MB each)</p>
                </div>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                    <p className="text-sm text-gray-600 mt-2">Uploading: {uploadProgress}%</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                     <Image
  src={img.localUrl}
  alt="Gig preview"
  width={96} // w-24 = 96px
  height={96} // h-24 = 96px
  className="object-cover rounded"
/>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.uploadedImages.map((url, index) => (
                    <div key={`uploaded-${index}`} className="relative">
                     <Image
  src={url}
  alt="Uploaded image"
  width={96} // w-24 = 96px
  height={96} // h-24 = 96px
  className="object-cover rounded"
/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Requirements & FAQ */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Requirements & FAQ</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements from Buyer
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    rows={4}
                    placeholder="What information do you need from the buyer to start working?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequently Asked Questions
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Add questions that buyers commonly ask about your service
                  </p>
                  <div className="space-y-4">
                    {formData.faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">FAQ {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              const newFaqs = formData.faqs.filter((_, i) => i !== index);
                              handleInputChange("faqs", newFaqs);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...formData.faqs];
                              newFaqs[index].question = e.target.value;
                              handleInputChange("faqs", newFaqs);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <textarea
                            placeholder="Answer"
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...formData.faqs];
                              newFaqs[index].answer = e.target.value;
                              handleInputChange("faqs", newFaqs);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newFaqs = [...formData.faqs, { question: "", answer: "" }];
                        handleInputChange("faqs", newFaqs);
                      }}
                      className="flex items-center text-green-600 hover:text-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                disabled={uploading}
              >
                Publish Gig
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}