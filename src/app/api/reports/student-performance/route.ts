import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Grade                         from 'models/Grade';
import Student                       from 'models/Student';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const classLevel = searchParams.get('classLevel');

    console.log('📈 Fetching student performance report...', { startDate, endDate, classLevel });

    // Build student query
    const studentQuery: Record<string, unknown> = { status: 'active' };
    if (classLevel && classLevel !== 'all') {
      studentQuery.classLevel = classLevel;
    }

    // Get all active students
    const students = await Student.find(studentQuery)
      .select('firstName lastName classLevel')
      .lean()
      .exec();

    console.log(`✅ Found ${students.length} students`);

    // Build date filter for grades
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Generate performance report for each student
    const studentReports = await Promise.all(
      students.map(async (student) => {
        const gradeQuery: Record<string, unknown> = { student: student._id };
        if (Object.keys(dateFilter).length > 0) {
          gradeQuery.testDate = dateFilter;
        }

        const grades = await Grade.find(gradeQuery).lean().exec();

        const totalGrades = grades.length;
        const averagePercentage =
          totalGrades > 0
            ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / totalGrades)
            : 0;

        // Calculate subject breakdown
        const subjectBreakdown: Record<string, { count: number; average: number }> = {};
        grades.forEach((grade) => {
          if (!subjectBreakdown[grade.subject]) {
            subjectBreakdown[grade.subject] = { count: 0, average: 0 };
          }
          subjectBreakdown[grade.subject].count++;
          subjectBreakdown[grade.subject].average += grade.percentage;
        });

        // Calculate averages for each subject
        Object.keys(subjectBreakdown).forEach((subject) => {
          const data = subjectBreakdown[subject];
          data.average = Math.round(data.average / data.count);
        });

        // Determine performance level
        let performance: 'excellent' | 'good' | 'average' | 'needs-improvement' = 'needs-improvement';
        if (averagePercentage >= 80) performance = 'excellent';
        else if (averagePercentage >= 70) performance = 'good';
        else if (averagePercentage >= 50) performance = 'average';

        return {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            classLevel: student.classLevel,
          },
          totalGrades,
          averagePercentage,
          subjectBreakdown,
          performance,
        };
      })
    );

    console.log(`✅ Generated ${studentReports.length} performance reports`);

    return NextResponse.json(studentReports);
  } catch (error) {
    console.error('❌ Error generating student performance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate student performance report' },
      { status: 500 }
    );
  }
}
