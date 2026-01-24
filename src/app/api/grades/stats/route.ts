import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../../lib/mongodb';
import Grade                         from '../../../../../models/Grade';
import Student                       from '../../../../../models/Student';
import User                          from '../../../../../models/User';

interface GradeWithPercentage {
  score: number;
  maxScore: number;
  percentage: number;
  subject: string;
  student: {
    classLevel: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subject = searchParams.get('subject');
    const classLevel = searchParams.get('classLevel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = {};

    if (studentId) query.student = studentId;
    if (subject && subject !== 'all') query.subject = subject;

    // Date range
    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) {
        (query.testDate as Record<string, unknown>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (query.testDate as Record<string, unknown>).$lte = end;
      }
    }

    let grades = await Grade.find(query)
      .populate('student', 'classLevel')
      .lean() as unknown as GradeWithPercentage[];

    // Filter by class level
    if (classLevel && classLevel !== 'all') {
      grades = grades.filter(
        (grade) => grade.student && grade.student.classLevel === classLevel
      );
    }

    // Calculate stats
    const totalGrades = grades.length;
    
    if (totalGrades === 0) {
      return NextResponse.json({
        stats: {
          totalGrades: 0,
          averageScore: 0,
          averagePercentage: 0,
          highestScore: 0,
          lowestScore: 0,
          passingRate: 0,
          subjectStats: [],
        },
      });
    }

    // Calculate percentages
    const percentages = grades.map(g => Math.round((g.score / g.maxScore) * 100));
    const scores = grades.map(g => g.score);
    
    const averagePercentage = Math.round(
      percentages.reduce((sum, p) => sum + p, 0) / totalGrades
    );
    
    const averageScore = Math.round(
      (scores.reduce((sum, s) => sum + s, 0) / totalGrades) * 10
    ) / 10;
    
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    const passingGrades = percentages.filter(p => p >= 50).length;
    const passingRate = Math.round((passingGrades / totalGrades) * 100);

    // Subject-wise stats
    const subjectMap = new Map<string, number[]>();
    grades.forEach(grade => {
      const percentage = Math.round((grade.score / grade.maxScore) * 100);
      if (!subjectMap.has(grade.subject)) {
        subjectMap.set(grade.subject, []);
      }
      subjectMap.get(grade.subject)?.push(percentage);
    });

    const subjectStats = Array.from(subjectMap.entries()).map(([subject, percentages]) => ({
      subject,
      count: percentages.length,
      average: Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
    }));

    // Count students
    const studentQuery: Record<string, unknown> = { status: 'active' };
    if (classLevel && classLevel !== 'all') {
      studentQuery.classLevel = classLevel;
    }
    const totalStudents = await Student.countDocuments(studentQuery);

    return NextResponse.json({
      stats: {
        totalGrades,
        totalStudents,
        averageScore,
        averagePercentage,
        highestScore,
        lowestScore,
        passingRate,
        subjectStats,
      },
    });
  } catch (error) {
    console.error('Error fetching grade stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade stats' },
      { status: 500 }
    );
  }
}
