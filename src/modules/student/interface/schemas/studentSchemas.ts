import { z } from 'zod';

const contactSchema = z.object({
  mobile: z.string().min(1, 'Mobile number is required').max(20),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

const enrollmentSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  courseFees: z.number().min(0, 'Course fees must be non-negative'),
  discount: z.number().min(0).optional(),
  netFees: z.number().min(0, 'Net fees must be non-negative'),
  remainingFees: z.number().min(0).optional(),
  totalPaid: z.number().min(0).optional(),
  downPayment: z.number().min(0).optional(),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  installmentCount: z.number().int().min(0).optional(),
  installmentAmount: z.number().min(0).optional(),
  companyId: z.string().optional(),
  companyName: z.string().max(200).optional(),
});

export const enrollStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    fatherName: z.string().max(100).optional(),
    contact: contactSchema,
    dateOfBirth: z.string().optional(),
    educationQualification: z.string().max(200).optional(),
    enrollment: enrollmentSchema,
    image: z.string().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    fatherName: z.string().max(100).optional(),
    contact: contactSchema.partial().optional(),
    dateOfBirth: z.string().optional(),
    educationQualification: z.string().max(200).optional(),
    enrollment: enrollmentSchema.partial().optional(),
    status: z.enum(['active', 'dropout', 'completed', 'suspended']).optional(),
    image: z.string().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const dropOutStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z
    .object({
      message: z.string().max(1000).optional(),
    })
    .optional(),
});

export const listStudentsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['active', 'dropout', 'completed', 'suspended']).optional(),
    search: z.string().optional(),
  }),
});

export const getStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
});

export const deleteStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
});

export const searchStudentsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
  }),
});

export const renewStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    extraFees: z.number().positive('Extra fees must be positive'),
    noOfInstallments: z.number().int().min(0, 'Number of installments must be non-negative'),
    duration: z.number().positive('Duration must be positive'),
  }),
});

export const createStudentAlertSchema = z.object({
  body: z.object({
    date: z.string().min(1, 'Date is required'),
    reminderDateTime: z.string().min(1, 'Reminder date/time is required'),
    status: z.enum(['pending', 'sent', 'dismissed', 'done', 'failed']).optional(),
    particulars: z.string().min(1, 'Particulars are required').max(2000),
    studentId: z.string().optional(),
  }),
});

export const updateStudentAlertSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Alert ID is required'),
  }),
  body: z.object({
    date: z.string().optional(),
    reminderDateTime: z.string().optional(),
    status: z.enum(['pending', 'sent', 'dismissed']).optional(),
    particulars: z.string().max(2000).optional(),
  }),
});

export const deleteStudentAlertSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Alert ID is required'),
  }),
});

export const getStudentByEmailSchema = z.object({
  params: z.object({
    email: z.string().email('Valid email is required'),
  }),
});

export const listStudentsByCompanySchema = z.object({
  params: z.object({
    companyId: z.string().min(1, 'Company ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['active', 'dropout', 'completed', 'suspended']).optional(),
    search: z.string().optional(),
  }),
});

export const listStudentsByCompanyCourseSchema = z.object({
  params: z.object({
    companyId: z.string().min(1, 'Company ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['active', 'dropout', 'completed', 'suspended']).optional(),
    search: z.string().optional(),
  }),
});

export const listStudentsForFeesCollectionSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
  }),
});

export const sendWarningMailSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    templateData: z.record(z.unknown()).optional(),
  }).optional(),
});

export const sendCancellationMailSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    templateData: z.record(z.unknown()).optional(),
  }).optional(),
});

export const sendReceiptMailSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    paymentId: z.string().optional(),
    paymentDetails: z.record(z.unknown()).optional(),
  }).passthrough(),
});

export const sendBulkMailSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().min(1)).min(1, 'At least one student ID is required'),
    subject: z.string().min(1, 'Subject is required').max(500),
    content: z.string().min(1, 'Content is required').max(10000),
  }),
});

export const sendCourseChangeMailSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    newCourseId: z.string().min(1, 'New course ID is required'),
    newCourseName: z.string().min(1, 'New course name is required'),
    additionalDetails: z.record(z.unknown()).optional(),
  }),
});
