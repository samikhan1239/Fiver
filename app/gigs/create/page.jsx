"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, DollarSign, Clock, CheckCircle } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CreateGig() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subcategory: "",
    description: "",
    tags: [],
    images: [],
    uploadedImages: [],
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

  const categories = [
    { id: "graphics", name: "Graphics & Design", subcategories: ["Logo Design", "Brand Identity", "Business Cards", "Social Media Graphics"], color: "from-coral-400 to-red-500" },
    { id: "digital-marketing", name: "Digital Marketing", subcategories: ["SEO", "Social Media Marketing", "Content Marketing", "Email Marketing"], color: "from-teal-400 to-cyan-500" },
    { id: "writing", name: "Writing & Translation", subcategories: ["Content Writing", "Copywriting", "Technical Writing", "Translation"], color: "from-lime-400 to-green-500" },
    { id: "video", name: "Video & Animation", subcategories: ["Video Editing", "Animation", "Motion Graphics", "Video Production"], color: "from-orange-400 to-red-500" },
    { id: "programming", name: "Programming & Tech", subcategories: ["Web Development", "Mobile Apps", "Game Development", "Data Science"], color: "from-blue-400 to-indigo-500" },
    { id: "business", name: "Business", subcategories: ["Business Plans", "Market Research", "Presentations", "Virtual Assistant"], color: "from-emerald-400 to-teal-500" },
  ];

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = token ? jwt.decode(token) : null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
  };

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
    setValidationErrors((prev) => ({ ...prev, [`${packageType}.price`]: "", [`${packageType}.features`]: "" }));
  };

  const addPackageFeature = (packageType) => {
    const currentFeatures = formData.packages[packageType].features;
    handlePackageChange(packageType, "features", [...currentFeatures, ""]);
  };

  const removePackageFeature = (packageType, index) => {
    const currentFeatures = formData.packages[packageType].features;
    const newFeatures = currentFeatures.filter((_, i) => i !== index);
    handlePackageChange(packageType, "features", newFeatures);
  };

  const updatePackageFeature = (packageType, index, value) => {
    const currentFeatures = formData.packages[packageType].features;
    const newFeatures = [...currentFeatures];
    newFeatures[index] = value;
    handlePackageChange(packageType, "features", newFeatures);
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      handleInputChange("tags", [...formData.tags, tag]);
    }
  };

  const removeTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    handleInputChange("tags", newTags);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      setError("Maximum 5 images allowed");
      console.error("Image selection error: Maximum 5 images allowed erbjuder:", { currentImages: formData.images.length, newFiles: files.length });
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

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    console.log("Image removed from preview:", { index, removedImage: formData.images[index] });
    handleInputChange("images", newImages);
  };

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
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in");
      console.error("Submission error: No user authenticated");
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the errors in the form");
      return;
    }

    try {
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

      const packagesArray = Object.values(formData.packages).map((pkg) => ({
        name: pkg.name,
        price: pkg.price.toString(),
        delivery: pkg.delivery,
        features: pkg.features,
      }));

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
          packages: packagesArray,
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

  const nextStep = () => {
    if (currentStep === 2) {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setError("Please fix the errors in the form");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-coral-400/20 to-orange-400/20 rounded-full blur-xl animate-bounce" />
        <div className="absolute bottom-32 left-40 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <div className="container mx-auto px-4 py-12 relative">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-teal-400/20 to-cyan-400/20 text-teal-300 border-teal-400/30 mb-6 px-4 py-2">
            🚀 Create Your Gig
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Launch Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Freelance Service
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build a gig that showcases your skills and attracts clients.
          </p>
        </div>

        {error && (
          <Card className="mb-8 border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-red-300 text-center font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-medium transition-all duration-300 ${
                      step <= currentStep
                        ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white"
                        : "bg-gray-700/50 text-gray-400"
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Gig Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="I will create a modern logo design for your business"
                      className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                        validationErrors.title ? "border-red-400" : "border-gray-700/50"
                      }`}
                      required
                      maxLength={80}
                    />
                    {validationErrors.title && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-1">{formData.title.length}/80 characters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                          validationErrors.category ? "border-red-400" : "border-gray-700/50"
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
                        <p className="text-red-400 text-sm mt-1">{validationErrors.category}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Subcategory *
                      </label>
                      <select
                        value={formData.subcategory}
                        onChange={(e) => handleInputChange("subcategory", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                          validationErrors.subcategory ? "border-red-400" : "border-gray-700/50"
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
                        <p className="text-red-400 text-sm mt-1">{validationErrors.subcategory}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={6}
                      placeholder="Describe your service in detail..."
                      className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                        validationErrors.description ? "border-red-400" : "border-gray-700/50"
                      }`}
                      required
                      maxLength={1200}
                    />
                    {validationErrors.description && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-1">{formData.description.length}/1200 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Search Tags (Max 5)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white border-0 px-3 py-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-2 text-white hover:text-gray-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </Badge>
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
                      className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(formData.packages).map(([key, pkg], index) => (
                    <Card
                      key={key}
                      className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm group"
                    >
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                      ></div>
                      <CardContent className="p-6 relative">
                        <h3 className="font-bold text-white mb-4 capitalize group-hover:text-teal-300 transition-colors duration-300">
                          {key} Package
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                              Price (INR) *
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <input
                                type="number"
                                value={pkg.price}
                                onChange={(e) => handlePackageChange(key, "price", e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                                  validationErrors[`${key}.price`] ? "border-red-400" : "border-gray-700/50"
                                }`}
                                required
                                min="5"
                                placeholder="Enter price (min ₹5)"
                              />
                            </div>
                            {validationErrors[`${key}.price`] && (
                              <p className="text-red-400 text-sm mt-1">{validationErrors[`${key}.price`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                              Delivery Time (days) *
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <select
                                value={pkg.delivery}
                                onChange={(e) => handlePackageChange(key, "delivery", e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                            <label className="block text-sm font-medium text-gray-200 mb-2">
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
                                    className={`flex-1 px-3 py-2 rounded-lg bg-gray-900/50 border text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                                      validationErrors[`${key}.features`] ? "border-red-400" : "border-gray-700/50"
                                    }`}
                                    required
                                  />
                                  {pkg.features.length > 1 && (
                                    <Button
                                      type="button"
                                      onClick={() => removePackageFeature(key, index)}
                                      className="text-red-400 hover:text-red-500 bg-transparent"
                                      variant="ghost"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {validationErrors[`${key}.features`] && (
                                <p className="text-red-400 text-sm mt-1">{validationErrors[`${key}.features`]}</p>
                              )}
                              <Button
                                type="button"
                                onClick={() => addPackageFeature(key)}
                                className="flex items-center text-teal-300 hover:text-teal-400 text-sm bg-transparent"
                                variant="ghost"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Feature
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Upload Images (Max 5)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleImageChange}
                        className="w-full p-2 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-400 file:text-white file:font-medium"
                        disabled={uploading}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Supported formats: JPG, PNG, GIF (Max 5MB each)</p>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-700/50 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-teal-400 to-cyan-400 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-300">Uploading: {uploadProgress}%</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={img.localUrl}
                          alt="Gig preview"
                          width={96}
                          height={96}
                          className="object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.uploadedImages.map((url, index) => (
                      <div key={`uploaded-${index}`} className="relative">
                        <Image
                          src={url}
                          alt="Uploaded image"
                          width={96}
                          height={96}
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Requirements from Buyer
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                      rows={4}
                      placeholder="What information do you need from the buyer to start working?"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Frequently Asked Questions
                    </label>
                    <p className="text-sm text-gray-400 mb-4">
                      Add questions that buyers commonly ask about your service
                    </p>
                    <div className="space-y-4">
                      {formData.faqs.map((faq, index) => (
                        <Card
                          key={index}
                          className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm group"
                        >
                          <div
                            className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                          ></div>
                          <CardContent className="p-4 relative">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-white">FAQ {index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => {
                                  const newFaqs = formData.faqs.filter((_, i) => i !== index);
                                  handleInputChange("faqs", newFaqs);
                                }}
                                className="text-red-400 hover:text-red-500 bg-transparent"
                                variant="ghost"
                              >
                                <X className="h-4 w-4" />
                              </Button>
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
                                className="w-full px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                                className="w-full px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                              />
                            </div>
                            <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        type="button"
                        onClick={() => {
                          const newFaqs = [...formData.faqs, { question: "", answer: "" }];
                          handleInputChange("faqs", newFaqs);
                        }}
                        className="flex items-center text-teal-300 hover:text-teal-400 bg-transparent"
                        variant="ghost"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add FAQ
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="border border-teal-400/50 text-teal-300 hover:bg-teal-400/20 px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300"
                    disabled={uploading}
                  >
                    Publish Gig
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}